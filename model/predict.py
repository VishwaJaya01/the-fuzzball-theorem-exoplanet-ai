
"""
Runtime model API for the backend.

Exposes:
- load_model(model_dir="/data/model")
- features_from_lightcurve(time, flux, flux_err=None, meta: dict|None=None)
- predict_from_lightcurve(time, flux, flux_err=None, meta: dict|None=None, model_dir="/data/model")

It supports TWO modes based on artifacts in model_dir:
  1) One-class baseline (IsolationForest + QuantileTransformer): files like model_iso_v1_oc.pkl, scaler_v1_oc.pkl
  2) Supervised XGBoost + Platt calibration: model_xgb_v*.pkl, calibrator_v*.pkl
Feature order is locked by feature_names_*.json.
"""

from __future__ import annotations
import json, joblib, numpy as np, pandas as pd
from pathlib import Path
from typing import Dict, Any, Optional
from astropy.timeseries import BoxLeastSquares

def load_model(model_dir: str | Path = "/data/model") -> Dict[str, Any]:
    md = Path(model_dir)
    latest = (md / "latest.txt").read_text().strip()
    state: Dict[str, Any] = {}
    if latest.startswith("model_iso_"):
        ver = latest.split("model_iso_")[1].split(".pkl")[0]
        state["mode"] = "one_class"
        state["model"] = joblib.load(md / latest)
        state["scaler"] = joblib.load(md / f"scaler_{ver}.pkl")
        state["feature_names"] = json.loads((md / f"feature_names_{ver}.json").read_text())
        state["calibrator"] = None
    elif latest.startswith("model_xgb_"):
        import xgboost as xgb  # only required in supervised mode
        ver = latest.split("model_xgb_")[1].split(".pkl")[0]
        state["mode"] = "supervised"
        state["model"] = joblib.load(md / latest)  # xgboost Booster
        state["calibrator"] = joblib.load(md / f"calibrator_{ver}.pkl") if (md / f"calibrator_{ver}.pkl").exists() else None
        state["feature_names"] = json.loads((md / f"feature_names_{ver}.json").read_text())
        state["xgb"] = xgb
        state["scaler"] = None
    else:
        raise RuntimeError(f"Unknown latest artifact name: {latest}")
    return state

def _clean_flux(time: np.ndarray, flux: np.ndarray):
    m = np.isfinite(time) & np.isfinite(flux)
    time, flux = time[m], flux[m]
    if len(time) < 200:
        return time, flux, {"insufficient": True, "data_fraction_kept": float(np.mean(m))}
    med = float(np.median(flux))
    mad = float(np.median(np.abs(flux - med))) + 1e-12
    m2 = np.abs(flux - med) < 5.0 * 1.4826 * mad
    return time[m2], flux[m2], {"insufficient": False, "data_fraction_kept": float(np.mean(m2))}

def _bls_features(time: np.ndarray, flux: np.ndarray, meta: Optional[Dict[str, Any]] = None,
                  period_min: float = 0.5, period_max: float = 30.0, n_periods: int = 5000,
                  dur_h_min: float = 0.5, dur_h_max: float = 10.0) -> pd.Series:
    out = {"warning": None}
    time, flux, flags = _clean_flux(time, flux)
    out["data_fraction_kept"] = flags.get("data_fraction_kept", np.nan)
    if flags.get("insufficient", False):
        out["warning"] = "insufficient_data"
        return pd.Series(out)

    # normalize flux (should already be flattened PDCSAP)
    flux = flux / np.median(flux) - 1.0

    periods = np.linspace(period_min, period_max, n_periods)
    durations = np.linspace(dur_h_min, dur_h_max, 20) / 24.0

    bls = BoxLeastSquares(time, flux)
    power = bls.power(periods, durations, oversample=5)
    i = int(np.argmax(power.power))

    period, t0, duration, depth, snr = (
        float(power.period[i]),
        float(power.transit_time[i]),
        float(power.duration[i]),
        float(power.depth[i]),
        float(power.power[i]),
    )

    baseline_days = float(time.max() - time.min())
    duty_cycle = duration / period if period > 0 else np.nan
    n_transits = baseline_days / period if period > 0 else np.nan

    # secondary SNR at phase 0.5
    phase = ((time - t0) / period) % 1.0
    sec_in = np.abs(phase - 0.5) < (duration / period) / 2
    sec_depth = float(np.median(flux[sec_in])) if sec_in.any() else np.nan
    sec_snr = float(np.abs(sec_depth) / (np.std(flux[~sec_in]) + 1e-12)) if sec_in.any() else np.nan

    # odd/even ratio (fold at 2*period)
    phase2 = ((time - t0) / (2 * period)) % 1.0
    in_even = (phase2 < (duration / (2 * period))) | (phase2 > 1 - (duration / (2 * period)))
    in_odd = np.abs(phase2 - 0.5) < (duration / (2 * period))
    depth_even = float(np.median(flux[in_even])) if in_even.any() else np.nan
    depth_odd = float(np.median(flux[in_odd])) if in_odd.any() else np.nan
    odd_even_ratio = (depth_odd / depth_even) if np.isfinite(depth_odd) and np.isfinite(depth_even) and depth_even != 0 else np.nan

    rms_before = float(np.std(flux))
    in_tr = np.abs(phase - 0) < (duration / period) / 2
    rms_after = float(np.std(flux[~in_tr])) if (~in_tr).any() else np.nan

    out.update({
        "period_days": period,
        "duration_hours": duration * 24,
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
    if meta:
        for k in ["tmag", "teff", "rad", "crowdsap", "contratio"]:
            if k in meta:
                out[k] = meta[k]
    return pd.Series(out)

def features_from_lightcurve(time, flux, flux_err=None, meta: Optional[Dict[str, Any]] = None) -> pd.Series:
    """Public API to compute the single-row feature vector from a cleaned light curve."""
    return _bls_features(np.asarray(time, float), np.asarray(flux, float), meta=meta)

def predict_from_lightcurve(time, flux, flux_err=None, meta: Optional[Dict[str, Any]] = None,
                            model_dir: str | Path = "/data/model") -> Dict[str, Any]:
    """Compute features → load latest model → return score + summary."""
    state = load_model(model_dir)
    feats = features_from_lightcurve(time, flux, flux_err, meta)
    fn = state["feature_names"]
    X = pd.DataFrame([feats]).reindex(columns=fn)
    X = X.fillna({c: X[c].median() for c in fn})

    if state["mode"] == "one_class":
        Xn = state["scaler"].transform(X)
        s = state["model"].decision_function(Xn)
        s = (s - s.min()) / (s.max() - s.min() + 1e-12)
        score = float(s[0])
    else:
        xgb = state["xgb"]
        dm = xgb.DMatrix(X, feature_names=fn)
        raw = state["model"].predict(dm)
        if state["calibrator"] is not None:
            score = float(state["calibrator"].predict_proba(X)[:, 1][0])
        else:
            score = float(raw[0])

    return {
        "score": score,
        "period_days": float(feats.get("period_days", np.nan)),
        "duration_hours": float(feats.get("duration_hours", np.nan)),
        "depth_ppm": float(feats.get("depth_ppm", np.nan)),
        "snr": float(feats.get("snr", np.nan)),
        "t0": float(feats.get("t0", np.nan)),
        "features": feats.to_dict(),
        "warnings": ([] if (feats.get("warning") in [None, np.nan]) else [feats.get("warning")]),
    }
