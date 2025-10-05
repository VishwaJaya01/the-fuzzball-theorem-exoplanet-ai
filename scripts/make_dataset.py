#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
make_dataset.py
Build a small, reproducible dataset of confirmed TESS planets.

What it does:
  1) Load TOI table (CSV or API) and filter CONFIRMED/CP rows
  2) Extract up to N TIC IDs (auto-detect 'tid'/'tic_id'/etc.)
  3) Download & preprocess SPOC light curves (fast mode):
       - prefer 2-min cadence
       - only 1 sector per TIC
       - QUALITY==0 masking, light outlier removal, flattening
  4) Save:
       data/processed/lightcurves/TIC-<id>.parquet (time, flux[, flux_err])
       data/processed/labels.parquet   (label=1 for these TICs)
       data/processed/tic_meta.parquet (Tmag, Teff, etc., when available)
       data/metadata/manifest.json
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import logging
import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Iterable, List, Optional, Tuple

import numpy as np
import pandas as pd

# Third-party astro libs
import lightkurve as lk
from astroquery.mast import Catalogs
from astroquery.mast import conf as mast_conf

# --------- Defaults ---------
DEFAULT_BASE = Path("data")
DEFAULT_WORKERS = 5              # be polite (3–6 is fine)
DEFAULT_LIMIT = 300              # cap for hackathon runs
DEFAULT_PREFER_EXPTIME = 120     # 2-min cadence
DEFAULT_MAX_SECTORS = 1          # fastest
MAST_TIMEOUT = 60                # seconds


# --------- Logging ---------
logging.getLogger("astroquery").setLevel(logging.ERROR)
lk.log.setLevel(logging.ERROR)
LOG = logging.getLogger("make_dataset")
LOG.setLevel(logging.INFO)
handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(logging.Formatter("%(levelname)s: %(message)s"))
LOG.addHandler(handler)

mast_conf.timeout = MAST_TIMEOUT


# --------- IO utils ---------
def ensure_dirs(base: Path) -> Tuple[Path, Path, Path, Path]:
    raw = base / "raw"
    proc = base / "processed"
    lc_out = proc / "lightcurves"
    meta = base / "metadata"
    for p in (raw, proc, lc_out, meta):
        p.mkdir(parents=True, exist_ok=True)
    return raw, proc, lc_out, meta


# --------- TOI loading & filtering ---------
def load_toi_table(toi_csv: Optional[str]) -> pd.DataFrame:
    if toi_csv:
        LOG.info(f"Loading TOI CSV: {toi_csv}")
        df = pd.read_csv(
            toi_csv,
            comment="#",
            encoding="utf-8-sig",
            engine="python",
            sep=None,
            on_bad_lines="skip",
        )
        return df

    LOG.info("Fetching TOI via API…")
    url = (
        "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?"
        "query=select+*+from+toi&format=csv"
    )
    df = pd.read_csv(url, comment="#", encoding="utf-8-sig")
    return df


def find_disposition_column(df: pd.DataFrame) -> str:
    lower = {c.lower(): c for c in df.columns}
    for key in ("tfopwg_disp", "disposition", "disp"):
        if key in lower:
            return lower[key]
    raise RuntimeError("Could not find disposition column (tfopwg_disp / disposition / disp).")


def filter_confirmed(df: pd.DataFrame, disp_col: str) -> pd.DataFrame:
    def is_conf(v) -> bool:
        s = str(v).strip().upper()
        return s in {"CP", "CONFIRMED"}
    out = df[df[disp_col].apply(is_conf)].copy()
    LOG.info(f"Confirmed rows: {len(out)}")
    return out


def detect_tic_column(df: pd.DataFrame) -> str:
    # Try common names first
    lower = {c.lower(): c for c in df.columns}
    for name in ("tid", "tic_id", "tic", "ticid", "tic id", "tic-id", "id"):
        if name in lower:
            return lower[name]
    # Fallback: any column containing 'tic'
    for c in df.columns:
        if "tic" in c.lower():
            return c
    raise RuntimeError("Could not detect a TIC column in the TOI table.")


def extract_tic_list(df_confirmed: pd.DataFrame, tic_col: str, limit: Optional[int]) -> List[int]:
    ser = (
        df_confirmed[tic_col]
        .astype(str)
        .str.extract(r"(\d+)", expand=False)  # pull digits even if "TIC 123..."
        .dropna()
        .astype("int64")
        .drop_duplicates()
    )
    if limit:
        ser = ser.head(limit)
    tics = ser.tolist()
    LOG.info(f"Selected unique TICs: {len(tics)}")
    return tics


# --------- Light curve download & preprocess ---------
def process_one_tic_fast(
    tic_id: int,
    lc_out: Path,
    raw_dir: Path,
    prefer_exptime: int = DEFAULT_PREFER_EXPTIME,
    max_sectors: int = DEFAULT_MAX_SECTORS,
) -> dict:
    """Download 1 SPOC LC (prefer 2-min), quick clean, save 'TIC-<id>.parquet'."""
    try:
        out_path = lc_out / f"TIC-{tic_id}.parquet"
        if out_path.exists():
            return {"tic_id": tic_id, "status": "cached"}

        # Prefer 2-min cadence; fall back to any SPOC LC
        sr = lk.search_lightcurve(f"TIC {tic_id}", mission="TESS", author="SPOC", exptime=prefer_exptime)
        if len(sr) == 0:
            sr = lk.search_lightcurve(f"TIC {tic_id}", mission="TESS", author="SPOC")
            if len(sr) == 0:
                return {"tic_id": tic_id, "status": "no_lc"}

        sr_use = sr[:max_sectors]  # fastest: first match only

        # Use local cache for FITS so reruns are instant
        lcs = [it.download(download_dir=str(raw_dir)) for it in sr_use]
        lc = lk.LightCurveCollection(lcs).stitch().remove_nans()

        # QUALITY mask (if present) + gentle clean
        try:
            if getattr(lc, "quality", None) is not None:
                lc = lc[lc.quality == 0]
        except Exception:
            pass
        try:
            lc = lc.remove_outliers(sigma=10).flatten(window_length=401)  # ~13h at 2-min cadence
        except Exception:
            pass

        df = pd.DataFrame(
            {
                "time": np.asarray(lc.time.value, "float64"),
                "flux": np.asarray(lc.flux.value, "float32"),
            }
        )
        if getattr(lc, "flux_err", None) is not None:
            df["flux_err"] = np.asarray(lc.flux_err.value, "float32")

        df.to_parquet(out_path, index=False)
        return {"tic_id": tic_id, "status": "ok", "rows": len(df)}
    except Exception as e:
        return {"tic_id": tic_id, "status": "error", "error": str(e)}


# --------- TIC metadata (safe, per ID) ---------
def fetch_one_tic_meta(tic_id: int) -> pd.DataFrame:
    """Fetch TIC metadata for one ID with a fallback by object name."""
    try:
        r = Catalogs.query_criteria(catalog="TIC", ID=int(tic_id))
        if len(r) > 0:
            return r.to_pandas()
    except Exception:
        pass
    try:
        r = Catalogs.query_object(f"TIC {int(tic_id)}", catalog="TIC")
        if len(r) > 0:
            return r.to_pandas()
    except Exception:
        pass
    return pd.DataFrame()


def fetch_tic_meta_parallel(tics: List[int], workers: int = 5) -> pd.DataFrame:
    frames = []
    with ThreadPoolExecutor(max_workers=workers) as ex:
        futs = {ex.submit(fetch_one_tic_meta, t): t for t in tics}
        for f in as_completed(futs):
            df = f.result()
            if not df.empty:
                frames.append(df)
    if not frames:
        return pd.DataFrame(columns=["tic_id", "tmag", "ra", "dec", "teff", "rad", "crowdsap", "contratio"])

    meta = pd.concat(frames, ignore_index=True)
    meta.columns = [c.lower() for c in meta.columns]

    wanted = ["tic_id", "tic", "id", "tmag", "ra", "dec", "teff", "rad", "crowdsap", "contratio"]
    keep = [c for c in wanted if c in meta.columns]
    meta = meta[keep].copy() if keep else meta.copy()

    for cand in ["tic_id", "tic", "id"]:
        if cand in meta.columns:
            meta.rename(columns={cand: "tic_id"}, inplace=True)
            break

    if "tic_id" in meta.columns:
        meta["tic_id"] = pd.to_numeric(meta["tic_id"], errors="coerce").astype("Int64")
        meta = meta.dropna(subset=["tic_id"]).copy()
        meta["tic_id"] = meta["tic_id"].astype(int)
        meta = meta.drop_duplicates(subset=["tic_id"])
    return meta


# --------- Main pipeline ---------
def main():
    ap = argparse.ArgumentParser(description="Build a confirmed-planets TESS dataset.")
    ap.add_argument("--toi_csv", type=str, default=None, help="Path to a TOI CSV export (optional).")
    ap.add_argument("--outdir", type=str, default=str(DEFAULT_BASE), help="Base output directory (default: data).")
    ap.add_argument("--limit", type=int, default=DEFAULT_LIMIT, help="Limit number of TICs (default: 300).")
    ap.add_argument("--workers", type=int, default=DEFAULT_WORKERS, help="Download workers (default: 5).")
    ap.add_argument("--prefer_exptime", type=int, default=DEFAULT_PREFER_EXPTIME, help="Preferred exposure (s), default 120.")
    ap.add_argument("--max_sectors", type=int, default=DEFAULT_MAX_SECTORS, help="Max sectors per TIC (default: 1).")
    ap.add_argument("--resume", action="store_true", help="Skip TICs already saved as parquet.")
    ap.add_argument("--labels_only", action="store_true", help="Only write labels (no downloads).")
    args = ap.parse_args()

    base = Path(args.outdir)
    raw, proc, lc_out, meta_dir = ensure_dirs(base)

    # 1) Load TOI & filter confirmed
    df_toi = load_toi_table(args.toi_csv)
    disp_col = find_disposition_column(df_toi)
    df_conf = filter_confirmed(df_toi, disp_col)

    # 2) Detect TIC column & build list
    tic_col = detect_tic_column(df_conf)
    tic_list = extract_tic_list(df_conf, tic_col, args.limit)

    # Labels (all 1's)
    labels_path = proc / "labels.parquet"
    labels = pd.DataFrame({"tic_id": tic_list, "label": 1})
    labels.to_parquet(labels_path, index=False)
    LOG.info(f"Wrote labels: {labels_path} ({len(labels)} rows)")

    if args.labels_only:
        LOG.info("labels_only set; skipping downloads.")
    else:
        # 3) Resume: skip already-saved light curves
        todo = tic_list
        if args.resume:
            have = {int(p.stem.split("-")[1]) for p in lc_out.glob("TIC-*.parquet")}
            todo = [t for t in tic_list if t not in have]
            LOG.info(f"Resume mode: already have {len(have)}; to download now: {len(todo)}")

        # 4) Parallel downloader
        LOG.info(f"Starting downloads with workers={args.workers}, prefer_exptime={args.prefer_exptime}, max_sectors={args.max_sectors}")
        results = []
        with ThreadPoolExecutor(max_workers=args.workers) as ex:
            futs = {ex.submit(process_one_tic_fast, t, lc_out, raw, args.prefer_exptime, args.max_sectors): t for t in todo}
            for f in as_completed(futs):
                results.append(f.result())

        # Summary log
        res_df = pd.DataFrame(results) if results else pd.DataFrame()
        if not res_df.empty:
            counts = res_df.value_counts(["status"]).to_dict()
            LOG.info(f"Download summary: {counts}")
            (meta_dir / "download_log.csv").write_text(res_df.to_csv(index=False))

    # 5) TIC metadata (for the TICs we truly have on disk)
    tic_ok = sorted({int(p.stem.split("-")[1]) for p in lc_out.glob("TIC-*.parquet")})
    LOG.info(f"TICs with saved light curves: {len(tic_ok)}")

    LOG.info("Fetching TIC metadata (parallel)…")
    tic_meta = fetch_tic_meta_parallel(tic_ok, workers=min(5, args.workers))
    tic_meta_path = proc / "tic_meta.parquet"
    tic_meta.to_parquet(tic_meta_path, index=False)
    LOG.info(f"Wrote TIC metadata: {tic_meta_path} ({len(tic_meta)} rows)")

    # 6) Manifest
    manifest = {
        "created_utc": dt.datetime.utcnow().isoformat() + "Z",
        "counts": {
            "tic_selected": len(tic_list),
            "lightcurves_saved": len(tic_ok),
            "labels_rows": len(labels),
            "tic_meta_rows": len(tic_meta),
        },
        "paths": {
            "lightcurves_dir": str(lc_out),
            "labels": str(labels_path),
            "tic_meta": str(tic_meta_path),
        },
        "source": {
            "toi": "NASA Exoplanet Archive TOI table",
            "filter": "CONFIRMED (CP/CONFIRMED)",
            "prefer_exptime": args.prefer_exptime,
            "max_sectors": args.max_sectors,
        },
        "notes": "Each TIC parquet has columns: time, flux[, flux_err]. PDCSAP-based, QUALITY==0, gentle outlier removal & flatten.",
    }
    (meta_dir / "manifest.json").write_text(json.dumps(manifest, indent=2))
    LOG.info(f"Wrote manifest: {meta_dir / 'manifest.json'}")
    LOG.info("✅ Done.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        LOG.warning("Interrupted by user.")
        sys.exit(130)
