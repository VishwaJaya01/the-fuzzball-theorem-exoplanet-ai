from __future__ import annotations

from pathlib import Path
from typing import Optional, Tuple

import numpy as np
import pandas as pd

from app.config import Settings

try:  # pragma: no cover - optional import
    from lightkurve import LightkurveError, search_lightcurve  # type: ignore
except ImportError:  # pragma: no cover - optional dependency
    LightkurveError = None  # type: ignore
    search_lightcurve = None  # type: ignore

REQUIRED_LC_COLUMNS = {'time', 'flux'}
OPTIONAL_LC_COLUMNS = {'flux_err'}


def _resolve_lightcurve_path(settings: Settings, tic_id: int) -> Path:
    return settings.processed_dir / 'lightcurves' / f'TIC-{tic_id}.parquet'


def _resolve_cache_path(settings: Settings, tic_id: int) -> Path:
    return settings.interim_dir / 'features' / f'TIC-{tic_id}.parquet'


def get_lightcurve_by_tic(settings: Settings, tic_id: int) -> Tuple[np.ndarray, np.ndarray, Optional[np.ndarray]]:
    path = _resolve_lightcurve_path(settings, tic_id)
    if not path.exists():
        raise FileNotFoundError(f'Lightcurve parquet not found for TIC {tic_id} at {path}')

    df = pd.read_parquet(path)
    missing = REQUIRED_LC_COLUMNS - set(df.columns)
    if missing:
        raise ValueError(f'Lightcurve parquet missing required columns: {missing}')

    time = df['time'].to_numpy(copy=True)
    flux = df['flux'].to_numpy(copy=True)
    flux_err = None
    if 'flux_err' in df.columns:
        flux_err = df['flux_err'].to_numpy(copy=True)
    return time, flux, flux_err


def read_cached_features(settings: Settings, tic_id: int) -> Optional[pd.Series]:
    path = _resolve_cache_path(settings, tic_id)
    if not path.exists():
        return None
    df = pd.read_parquet(path)
    if df.empty:
        return None
    return df.iloc[0]


def write_cached_features(settings: Settings, tic_id: int, features: pd.Series) -> None:
    path = _resolve_cache_path(settings, tic_id)
    path.parent.mkdir(parents=True, exist_ok=True)
    df = features.to_frame().T
    df.to_parquet(path, index=False)


def _to_numpy(values: np.ndarray) -> np.ndarray:
    if np.ma.isMaskedArray(values):
        values = values.filled(np.nan)
    return np.asarray(values, dtype=float)


def fetch_lightcurve_from_mast(settings: Settings, tic_id: int, sector: int | None = None) -> Path:
    if search_lightcurve is None or LightkurveError is None:
        raise RuntimeError('lightkurve is required for automatic lightcurve fetching')

    authors = [settings.auto_fetch_author, 'SPOC', 'QLP', 'TESS-SPOC', None]
    authors = [a for a in authors if a is not None]
    authors.append(None)
    seen_authors: set[str | None] = set()
    authors_ordered: list[str | None] = []
    for author in authors:
        if author not in seen_authors:
            seen_authors.add(author)
            authors_ordered.append(author)

    flux_columns = [settings.auto_fetch_flux_column, 'pdcsap_flux', 'sap_flux', 'flux']
    seen_flux: set[str] = set()
    flux_ordered: list[str] = []
    for column in flux_columns:
        if column and column not in seen_flux:
            seen_flux.add(column)
            flux_ordered.append(column)

    last_exc: Exception | None = None

    for author in authors_ordered:
        search = search_lightcurve(
            f'TIC {tic_id}',
            mission='TESS',
            sector=sector,
            author=author,
        )
        if len(search) == 0:
            continue

        for flux_column in flux_ordered:
            try:
                collection = search.download_all(download_dir=None, flux_column=flux_column)
                if collection is None or len(collection) == 0:
                    continue
                lc = collection.stitch().remove_nans()
                df = pd.DataFrame({
                    'time': _to_numpy(lc.time.value),
                    'flux': _to_numpy(lc.flux.value),
                })
                if getattr(lc, 'flux_err', None) is not None:
                    df['flux_err'] = _to_numpy(lc.flux_err.value)
                df = df.replace([np.inf, -np.inf], np.nan).dropna()
                if len(df) < 200:
                    continue
                output_path = _resolve_lightcurve_path(settings, tic_id)
                output_path.parent.mkdir(parents=True, exist_ok=True)
                df.to_parquet(output_path, index=False)
                return output_path
            except LightkurveError as exc:  # pragma: no cover - network/io heavy
                message = str(exc)
                marker = 'Data product '
                if marker in message:
                    try:
                        part = message.split(marker, 1)[1].split(' of type', 1)[0].strip()
                        cache_path = Path(part).parent
                        shutil.rmtree(cache_path, ignore_errors=True)
                    except Exception:
                        pass
                last_exc = exc
                continue

    if last_exc is not None:
        raise RuntimeError(
            f'Failed to download lightcurve for TIC {tic_id} using authors {authors_ordered} '
            f'and flux columns {flux_ordered}: {last_exc}'
        ) from last_exc
    raise RuntimeError(
        f'Failed to download lightcurve for TIC {tic_id}; no matching products found'
    )
