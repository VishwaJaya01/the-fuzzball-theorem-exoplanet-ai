#!/usr/bin/env python3
"""
Build BLS-based features for each TIC light curve (CPU-only), one row per TIC.

Layout (defaults; can be overridden with --root/--processed/--interim):
  <root>/processed/lightcurves/TIC-<id>.parquet   (inputs: time, flux[, flux_err])
  <root>/processed/labels.parquet                 (optional here; not used for feature build)
  <root>/processed/tic_meta.parquet               (optional: tmag, teff, rad, crowdsap, contratio)

Outputs:
  <root>/interim/features/TIC-<id>.parquet        (one-row feature parquet per TIC, resumable)
  <root>/interim/features_all.parquet             (combined feature table, one row per TIC)

CLI examples:
  python build_features.py --root . --workers 4
  python build_features.py --processed /path/processed --interim /path/interim --force

Notes:
- BLS only (TLS optional later).
- Resumable: skips TICs that already have a feature file unless --force.
"""

from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
from typing import Optional, Dict, Any, Iterable, List

import numpy as np
import pandas as pd
from astropy.timeseries import BoxLeastSquares
from concurrent.futures import ThreadPoolExecutor, as_completed


def _clean_flux(time: np.ndarray, flux: np.ndarray):
    m = np.isfinite(time) & np.isfinite(flux)
    time, flux = time[m], flux[m]
    if len(time) < 200:
        return time, flux, {"insufficient": True, "data_fraction_kept": float(np.mean(m))}
    med = float(np.median(flux))
    mad = float(np.median(np.abs(flux - med))) + 1e-12
    m2 = np.abs(flux - med) < 5.0 * 1.4826 * mad
    return time[m2], flux[m2], {"insufficient": False, "data_fraction_kept": float(np.mean(m2))}


def _bls_features_from_parquet(parquet_path: Path,
                               cfg: Dict[str, Any],
                               meta_df: Optional[pd.DataFrame]) -> pd.Series:
    tic_id = int(parquet_path.stem.split('-')[1])
    df = pd.read_parquet(parquet_path)
    time = df['time'].to_numpy(float)
    flux = df['flux'].to_numpy(float)

    time, flux, flags = _clean_flux(time, flux)
    out = {"tic_id": tic_id, "warning": None, "data_fraction_kept": flags.get("data_fraction_kept", np.nan)}

    if flags.get("insufficient", False):
        out["warning"] = "insufficient_data"
        return pd.Series(out)

    # normalize (already flattened PDCSAP)
    flux = flux / np.median(flux) - 1.0

    # grids
    periods = np.linspace(cfg["bls_period_days_min"], cfg["bls_period_days_max"], cfg["bls_n_periods"])
    durations = np.linspace(cfg["duration_hours_min"], cfg["duration_hours_max"], 20) / 24.0

    bls = BoxLeastSquares(time, flux)
    power = bls.power(periods, durations, oversample=5)
    i = int(np.argmax(power.power))
    period = float(power.period[i])
    t0 = float(power.transit_time[i])
    duration = float(power.duration[i])
    depth = float(power.depth[i])
    snr = float(power.power[i])

    baseline_days = float(time.max() - time.min())
    duty_cycle = (duration / period) if period > 0 else np.nan
    n_transits = (baseline_days / period) if period > 0 else np.nan

    # secondary eclipse SNR at phase 0.5
    phase = ((time - t0) / period) % 1.0
    sec_in = np.abs(phase - 0.5) < (duration / period) / 2
    sec_depth = float(np.median(flux[sec_in])) if sec_in.any() else np.nan
    sec_snr = float(np.abs(sec_depth) / (np.std(flux[~sec_in]) + 1e-12)) if sec_in.any() else np.nan

    # odd-even ratio (fold at 2*period)
    phase2 = ((time - t0) / (2 * period)) % 1.0
    in_even = (phase2 < (duration / (2 * period))) | (phase2 > 1 - (duration / (2 * period)))
    in_odd = np.abs(phase2 - 0.5) < (duration / (2 * period))
    depth_even = float(np.median(flux[in_even])) if in_even.any() else np.nan
    depth_odd = float(np.median(flux[in_odd])) if in_odd.any() else np.nan
    odd_even_ratio = (depth_odd / depth_even) if np.isfinite(depth_odd) and np.isfinite(depth_even) and depth_even != 0 else np.nan

    rms_before = float(np.std(flux))
    in_transit = np.abs(phase - 0) < (duration / period) / 2
    rms_after = float(np.std(flux[~in_transit])) if (~in_transit).any() else np.nan

    out.update({
        "period_days": period,
        "duration_hours": duration * 24.0,
        "depth_ppm": -depth * 1e6,
        "snr": snr,
        "t0": t0,
        "duty_cycle": duty_cycle,
        "n_transits": n_transits,
        "odd_even_depth_ratio": odd_even_ratio,
        "secondary_snr": sec_snr,
        "in_vs_out_rms": (rms_after / rms_before) if np.isfinite(rms_after) and rms_before > 0 else np.nan,
        "rms_before": rms_before,
        "rms_after": rms_after,
    })

    # Optional TIC meta
    if meta_df is not None and tic_id in meta_df.index:
        md = meta_df.loc[tic_id]
        for k in ["tmag", "teff", "rad", "crowdsap", "contratio"]:
            if k in md:
                v = md[k]
                out[k] = float(v) if pd.notnull(v) else np.nan

    return pd.Series(out)


def _write_one(tic_parquet: Path, out_dir: Path, cfg: Dict[str, Any], meta_df: Optional[pd.DataFrame]) -> Path:
    s = _bls_features_from_parquet(tic_parquet, cfg, meta_df)
    out_path = out_dir / f"TIC-{int(tic_parquet.stem.split('-')[1])}.parquet"
    s.to_frame().T.to_parquet(out_path)
    return out_path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".", help="Project root containing processed/ and interim/")
    ap.add_argument("--processed", default=None, help="Override processed/ path")
    ap.add_argument("--interim", default=None, help="Override interim/ path")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--force", action="store_true", help="Recompute even if per-TIC features exist")
    ap.add_argument("--period-min", type=float, default=0.5)
    ap.add_argument("--period-max", type=float, default=30.0)
    ap.add_argument("--n-periods", type=int, default=5000)
    ap.add_argument("--dur-min-h", type=float, default=0.5)
    ap.add_argument("--dur-max-h", type=float, default=10.0)
    args = ap.parse_args()

    root = Path(args.root).resolve()
    processed = Path(args.processed).resolve() if args.processed else root / "processed"
    interim = Path(args.interim).resolve() if args.interim else root / "interim"
    lcs_dir = processed / "lightcurves"
    feats_dir = interim / "features"
    feats_dir.mkdir(parents=True, exist_ok=True)
    interim.mkdir(parents=True, exist_ok=True)

    labels_path = processed / "labels.parquet"  # not required here
    meta_path = processed / "tic_meta.parquet"
    meta_df = pd.read_parquet(meta_path).set_index("tic_id") if meta_path.exists() else None

    cfg = {
        "bls_period_days_min": args.period_min,
        "bls_period_days_max": args.period_max,
        "bls_n_periods": args.n_periods,
        "duration_hours_min": args.dur_min_h,
        "duration_hours_max": args.dur_max_h,
    }

    tic_files = sorted(lcs_dir.glob("TIC-*.parquet"))
    if not tic_files:
        raise FileNotFoundError(f"No TIC-*.parquet found in {lcs_dir}")

    done_ids = {int(p.stem.split('-')[1]) for p in feats_dir.glob("TIC-*.parquet")}
    tasks: List[Path] = []
    for p in tic_files:
        tic = int(p.stem.split('-')[1])
        if not args.force and tic in done_ids:
            continue
        tasks.append(p)

    print(f"Total TICs: {len(tic_files)} | To process: {len(tasks)} | Skipping: {len(tic_files) - len(tasks)}")
    if tasks:
        with ThreadPoolExecutor(max_workers=args.workers) as ex:
            futures = [ex.submit(_write_one, p, feats_dir, cfg, meta_df) for p in tasks]
            for i, fut in enumerate(as_completed(futures), 1):
                _ = fut.result()
                if i % 50 == 0 or i == len(tasks):
                    print(f"  wrote {i}/{len(tasks)}")

    # Combine per-TIC feature rows → features_all.parquet
    all_feat_files = sorted(feats_dir.glob("TIC-*.parquet"))
    if not all_feat_files:
        raise RuntimeError(f"No per-TIC feature files in {feats_dir}")
    df_list = [pd.read_parquet(p) for p in all_feat_files]
    feats_all = pd.concat(df_list, ignore_index=True).sort_values("tic_id").reset_index(drop=True)
    out_all = interim / "features_all.parquet"
    feats_all.to_parquet(out_all)
    print(f"Wrote combined features: {out_all} | rows: {len(feats_all)}")

    # Optional echo for automation
    summary = {
        "processed": str(processed),
        "interim": str(interim),
        "features_all": str(out_all),
        "n_tics": len(feats_all),
        "config": cfg,
        "has_meta": meta_df is not None,
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
