from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, List, Tuple

import numpy as np
import pandas as pd
from astropy.timeseries import BoxLeastSquares

from app.config import Settings

MIN_SAMPLES = 200
META_FEATURE_KEYS = ('tmag', 'teff', 'rad', 'crowdsap', 'contratio')


class InsufficientDataError(Exception):
    """Raised when the light curve does not contain enough high-quality samples."""


@dataclass
class BLSResult:
    features: pd.Series
    summary: Dict[str, float]
    warnings: List[str]


def _mad(values: np.ndarray) -> float:
    diff = np.abs(values - np.median(values))
    return np.median(diff)


def _five_sigma_clip(
    time: np.ndarray,
    flux: np.ndarray,
    flux_err: np.ndarray | None,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray | None, float]:
    median = np.median(flux)
    mad = _mad(flux)
    if mad == 0:
        return time, flux, flux_err, 1.0
    threshold = 5.0 * 1.4826 * mad
    mask = np.abs(flux - median) <= threshold
    clipped_time = time[mask]
    clipped_flux = flux[mask]
    clipped_err = flux_err[mask] if flux_err is not None else None
    return clipped_time, clipped_flux, clipped_err, float(np.count_nonzero(mask) / len(flux))


def _as_float(value: object) -> float | None:
    try:
        if value is None:
            return None
        if isinstance(value, (tuple, list, np.ndarray)):
            if len(value) == 0:
                return None
            return float(np.asarray(value, dtype=float)[0])
        return float(value)
    except Exception:  # pragma: no cover - defensive
        return None


def build_bls_features(
    settings: Settings,
    time: Iterable[float],
    flux: Iterable[float],
    flux_err: Iterable[float] | None = None,
    meta: Dict[str, float] | None = None,
) -> BLSResult:
    """Compute BLS-derived features mirroring the training pipeline."""
    warnings: List[str] = []

    time_arr = np.asarray(list(time), dtype=float)
    flux_arr = np.asarray(list(flux), dtype=float)
    if flux_err is not None:
        flux_err_arr = np.asarray(list(flux_err), dtype=float)
    else:
        flux_err_arr = None

    finite_mask = np.isfinite(time_arr) & np.isfinite(flux_arr)
    if flux_err_arr is not None:
        finite_mask &= np.isfinite(flux_err_arr)
    time_arr = time_arr[finite_mask]
    flux_arr = flux_arr[finite_mask]
    if flux_err_arr is not None:
        flux_err_arr = flux_err_arr[finite_mask]

    if time_arr.size < MIN_SAMPLES:
        raise InsufficientDataError('insufficient samples after removing non-finite values')

    order = np.argsort(time_arr)
    time_arr = time_arr[order]
    flux_arr = flux_arr[order]
    if flux_err_arr is not None:
        flux_err_arr = flux_err_arr[order]

    time_arr, flux_arr, flux_err_arr, fraction_kept = _five_sigma_clip(time_arr, flux_arr, flux_err_arr)
    if time_arr.size < MIN_SAMPLES:
        raise InsufficientDataError('insufficient samples after clipping')
    if fraction_kept < 0.8:
        warnings.append('aggressive_clipping')

    median_flux = np.median(flux_arr)
    if not np.isfinite(median_flux) or median_flux == 0:
        raise ValueError('median flux is invalid for normalization')

    norm_flux = flux_arr / median_flux - 1.0
    if flux_err_arr is not None:
        norm_flux_err = flux_err_arr / median_flux
    else:
        norm_flux_err = None

    bls = BoxLeastSquares(time_arr, norm_flux, dy=norm_flux_err)
    periods = np.linspace(settings.period_min, settings.period_max, settings.n_periods)
    durations = np.linspace(settings.dur_min_hours, settings.dur_max_hours, 20) / 24.0
    results = bls.power(periods, durations)
    if results.power.size == 0:
        raise ValueError('BLS did not return any power spectrum results')

    best_idx = int(np.nanargmax(results.power))
    best_period = float(results.period[best_idx])
    best_duration = float(results.duration[best_idx])
    best_t0 = float(results.transit_time[best_idx])

    stats_table = bls.compute_stats(best_period, best_duration, best_t0)

    depth_value: float | None = None
    depth_snr = float(results.power[best_idx])
    transit_mask_array: np.ndarray | None = None

    if hasattr(stats_table, 'colnames'):
        if 'depth' in stats_table.colnames:
            depth_value = float(stats_table['depth'][0])
        if 'depth_snr' in stats_table.colnames:
            depth_snr = float(stats_table['depth_snr'][0])
        if 'transit_mask' in stats_table.colnames:
            transit_mask_array = np.asarray(stats_table['transit_mask'][0], dtype=bool)
        elif 'in_transit_mask' in stats_table.colnames:
            transit_mask_array = np.asarray(stats_table['in_transit_mask'][0], dtype=bool)
    elif isinstance(stats_table, dict):
        depth_value = _as_float(stats_table.get('depth'))
        depth_snr_candidate = _as_float(stats_table.get('depth_snr'))
        if depth_snr_candidate is not None:
            depth_snr = depth_snr_candidate
        mask_candidate = stats_table.get('transit_mask') or stats_table.get('in_transit_mask')
        if mask_candidate is not None:
            transit_mask_array = np.asarray(mask_candidate, dtype=bool)

    if depth_value is None:
        depth_value = float(results.depth[best_idx])

    if transit_mask_array is None:
        transit_mask_array = bls.transit_mask(time_arr, period=best_period, duration=best_duration, transit_time=best_t0)
    else:
        transit_mask_array = transit_mask_array.astype(bool)

    flux_in = norm_flux[transit_mask_array]
    flux_out = norm_flux[~transit_mask_array]
    out_std = np.std(flux_out) if flux_out.size else 0.0
    in_std = np.std(flux_in) if flux_in.size else 0.0
    in_vs_out_rms = float((in_std / out_std) if out_std else 1.0)

    baseline_days = float(time_arr[-1] - time_arr[0]) if time_arr.size else 0.0
    n_transits = baseline_days / best_period if best_period > 0 else 0.0
    n_transits = float(max(n_transits, 1.0))

    if results.power.size > 1:
        second_idx = int(np.argsort(results.power)[-2])
        second_best_power = float(results.power[second_idx])
    else:
        second_best_power = 0.0
    secondary_snr = float(second_best_power / results.power[best_idx]) if results.power[best_idx] else 0.0

    if best_period > 0:
        transit_numbers = np.floor((time_arr - best_t0) / best_period + 1e-6).astype(int)
    else:
        transit_numbers = np.zeros_like(time_arr, dtype=int)
    odd_mask = transit_mask_array & (transit_numbers % 2 == 0)
    even_mask = transit_mask_array & (transit_numbers % 2 == 1)
    if odd_mask.any() and even_mask.any():
        odd_depth = float(np.abs(np.mean(norm_flux[odd_mask])))
        even_depth = float(np.abs(np.mean(norm_flux[even_mask])))
        odd_even_depth_ratio = float(odd_depth / even_depth) if even_depth else 1.0
    else:
        odd_even_depth_ratio = 1.0

    rms_before = float(np.std(norm_flux[time_arr < best_t0])) if np.any(time_arr < best_t0) else np.nan
    rms_after = float(np.std(norm_flux[time_arr > best_t0])) if np.any(time_arr > best_t0) else np.nan

    duty_cycle = float(best_duration / best_period) if best_period > 0 else 0.0

    features = {
        'period_days': best_period,
        'duration_hours': best_duration * 24.0,
        'depth_ppm': depth_value * 1e6,
        'snr': depth_snr,
        't0_btjd': best_t0,
        'duty_cycle': duty_cycle,
        'n_transits': n_transits,
        'odd_even_depth_ratio': odd_even_depth_ratio,
        'secondary_snr': secondary_snr,
        'in_vs_out_rms': in_vs_out_rms,
        'rms_before': rms_before,
        'rms_after': rms_after,
        'data_fraction_kept': fraction_kept,
    }

    if meta:
        for key in META_FEATURE_KEYS:
            if key in meta:
                features[key] = float(meta[key])

    summary = {
        'period_days': features['period_days'],
        'duration_hours': features['duration_hours'],
        'depth_ppm': features['depth_ppm'],
        'snr': features['snr'],
        't0_btjd': features['t0_btjd'],
    }

    bls_series = pd.Series(features, dtype='float64')
    return BLSResult(features=bls_series, summary=summary, warnings=warnings)
