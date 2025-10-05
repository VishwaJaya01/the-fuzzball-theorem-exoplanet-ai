"""Download a TESS light curve for a TIC, write parquet, and optionally score with the backend."""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

try:
    from lightkurve import LightkurveError, search_lightcurve  # type: ignore
except ImportError as exc:  # pragma: no cover - optional dependency
    raise SystemExit("Install lightkurve first: python -m pip install lightkurve") from exc

import httpx


def _cleanup_path_from_exception(exc: LightkurveError) -> None:
    message = str(exc)
    marker = "Data product "
    if marker not in message:
        return
    try:
        path_part = message.split(marker, 1)[1].split(" of type", 1)[0].strip()
        candidate = Path(path_part)
        if candidate.exists():
            shutil.rmtree(candidate.parent, ignore_errors=True)
    except Exception:  # pragma: no cover - best effort cleanup
        pass


def _unique(seq: list[Any]) -> list[Any]:
    seen: set[Any] = set()
    ordered: list[Any] = []
    for item in seq:
        key = item
        if key in seen:
            continue
        seen.add(key)
        ordered.append(item)
    return ordered


def _to_numpy(values: Any) -> np.ndarray:
    arr = np.asarray(values)
    if np.ma.isMaskedArray(arr):
        arr = arr.filled(np.nan)
    return np.asarray(arr, dtype=float)


def download_lightcurve(
    tic_id: int,
    sector: int | None = None,
    flux_column: str = "pdcsap_flux",
    author: str | None = "SPOC",
) -> pd.DataFrame:
    author_candidates = _unique([author, "SPOC", "QLP", "TESS-SPOC", None])
    flux_candidates = _unique([flux_column, "pdcsap_flux", "sap_flux", "flux"])

    last_exc: Exception | None = None

    for author_candidate in author_candidates:
        search = search_lightcurve(
            f"TIC {tic_id}",
            mission="TESS",
            sector=sector,
            author=author_candidate,
        )
        if len(search) == 0:
            continue

        for flux_candidate in flux_candidates:
            try:
                collection = search.download_all(download_dir=None, flux_column=flux_candidate)
                if collection is None or len(collection) == 0:
                    continue
                lc = collection.stitch().remove_nans()
                df = pd.DataFrame({
                    "time": _to_numpy(lc.time.value),
                    "flux": _to_numpy(lc.flux.value),
                })
                if getattr(lc, "flux_err", None) is not None:
                    df["flux_err"] = _to_numpy(lc.flux_err.value)
                df = df.replace([np.inf, -np.inf], np.nan).dropna()
                if len(df) < 200:
                    raise RuntimeError(
                        f"Light curve for TIC {tic_id} has fewer than 200 samples after cleaning",
                    )
                return df
            except LightkurveError as exc:
                _cleanup_path_from_exception(exc)
                last_exc = exc
                continue

    raise RuntimeError(
        f"Failed to download light curve for TIC {tic_id}; tried authors {author_candidates} "
        f"and flux columns {flux_candidates}"
    ) from last_exc


def write_parquet(df: pd.DataFrame, output_dir: Path, tic_id: int) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / "lightcurves" / f"TIC-{tic_id}.parquet"
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(path, index=False)
    return path


def call_backend(df: pd.DataFrame, backend_url: str) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "time": df["time"].tolist(),
        "flux": df["flux"].tolist(),
    }
    if "flux_err" in df.columns:
        payload["flux_err"] = df["flux_err"].tolist()

    with httpx.Client(timeout=60.0) as client:
        resp = client.post(f"{backend_url.rstrip('/')}/predict/from_lightcurve", json=payload)
        resp.raise_for_status()
        return resp.json()


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch a TESS light curve and prepare it for the backend.")
    parser.add_argument("tic_id", type=int, help="TIC identifier")
    parser.add_argument("--sector", type=int, help="Optional TESS sector to restrict the search")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("../data/processed"),
        help="Directory where parquet should be written (default: ../data/processed)",
    )
    parser.add_argument(
        "--backend",
        type=str,
        default=None,
        help="FastAPI base URL; if provided, call /predict/from_lightcurve",
    )
    parser.add_argument(
        "--flux-column",
        type=str,
        default="pdcsap_flux",
        help="Flux column to try first (default: pdcsap_flux)",
    )
    parser.add_argument(
        "--author",
        type=str,
        default="SPOC",
        help="Preferred data author (SPOC, QLP, etc.)",
    )
    args = parser.parse_args()

    df = download_lightcurve(args.tic_id, args.sector, flux_column=args.flux_column, author=args.author)
    parquet_path = write_parquet(df, args.output_dir, args.tic_id)
    print(f"Saved parquet to {parquet_path}")

    if args.backend:
        prediction = call_backend(df, args.backend)
        print(json.dumps(prediction, indent=2))


if __name__ == "__main__":
    main()
