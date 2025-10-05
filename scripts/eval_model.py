#!/usr/bin/env python3
"""
Evaluate a trained model on features_all (+ labels) and optionally export scored tables.

Supports two runtime modes (auto-detected from artifacts/latest.txt):
  - One-class baseline: IsolationForest + QuantileTransformer  (files: model_iso_*.pkl, scaler_*.pkl)
  - Supervised XGBoost + optional Platt calibration             (files: model_xgb_*.pkl, calibrator_*.pkl)

Layout (defaults; override with CLI):
  <root>/interim/features_all.parquet
  <root>/processed/labels.parquet
  <root>/artifacts/*, latest.txt

Outputs (optional):
  <root>/interim/scored.parquet
  <root>/interim/top_k_candidates.csv

Examples:
  python eval_model.py --root . --export --topk 100
  python eval_model.py --processed /p/processed --interim /p/interim --artifacts /p/artifacts --threshold 0.9
"""

from __future__ import annotations
import argparse
import json
from pathlib import Path
from typing import Dict, Any, Tuple, Optional, List

import numpy as np
import pandas as pd


def load_artifacts(artifacts_dir: Path) -> Dict[str, Any]:
    latest = (artifacts_dir / "latest.txt").read_text().strip()
    state: Dict[str, Any] = {"latest": latest}

    # feature names file shares the version suffix
    if latest.startswith("model_iso_"):
        ver = latest.split("model_iso_")[1].split(".pkl")[0]
        import joblib
        state["mode"] = "one_class"
        state["model"] = joblib.load(artifacts_dir / latest)
        state["scaler"] = joblib.load(artifacts_dir / f"scaler_{ver}.pkl")
        state["feature_names"] = json.loads((artifacts_dir / f"feature_names_{ver}.json").read_text())
        state["calibrator"] = None
        state["needs_xgb"] = False
    elif latest.startswith("model_xgb_"):
        ver = latest.split("model_xgb_")[1].split(".pkl")[0]
        import joblib, xgboost as xgb
        state["mode"] = "supervised"
        state["model"] = joblib.load(artifacts_dir / latest)    # Booster
        state["calibrator"] = (joblib.load(artifacts_dir / f"calibrator_{ver}.pkl")
                               if (artifacts_dir / f"calibrator_{ver}.pkl").exists() else None)
        state["feature_names"] = json.loads((artifacts_dir / f"feature_names_{ver}.json").read_text())
        state["xgb"] = xgb
        state["scaler"] = None
        state["needs_xgb"] = True
    else:
        raise RuntimeError(f"Unknown latest model file: {latest}")
    return state


def predict_scores(X: pd.DataFrame, state: Dict[str, Any]) -> np.ndarray:
    # Ensure feature order and NaN handling match training
    fn = state["feature_names"]
    X = X.reindex(columns=fn)
    X = X.fillna({c: X[c].median() for c in fn})

    if state["mode"] == "one_class":
        Xn = state["scaler"].transform(X)
        s = state["model"].decision_function(Xn)    # higher = more inlier
        s = (s - s.min()) / (s.max() - s.min() + 1e-12)  # map to 0..1
        return s
    else:
        dm = state["xgb"].DMatrix(X, feature_names=state["feature_names"])
        raw = state["model"].predict(dm)
        if state["calibrator"] is not None:
            # Calibrator expects DataFrame
            prob = state["calibrator"].predict_proba(X)[:, 1]
            return prob
        return raw


def compute_metrics(y_true: np.ndarray, y_score: np.ndarray) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    uniq = np.unique(y_true)
    if len(uniq) == 1:
        # Only one class present (e.g., all 1's) → ranking metrics aren't meaningful.
        out["note"] = "Only one class present; supervised metrics not computed."
        out["mean_score"] = float(np.mean(y_score))
        out["p90_score"] = float(np.quantile(y_score, 0.90))
        return out

    from sklearn.metrics import average_precision_score, roc_auc_score, precision_recall_curve, confusion_matrix

    out["AUPRC"] = float(average_precision_score(y_true, y_score))
    out["ROC_AUC"] = float(roc_auc_score(y_true, y_score))
    # Some convenient PR points
    precision, recall, thresholds = precision_recall_curve(y_true, y_score)
    out["pr_curve_samples"] = len(thresholds)
    out["precision_head"] = float(precision[:5].mean()) if len(precision) >= 5 else float(np.mean(precision))
    out["recall_head"] = float(recall[:5].mean()) if len(recall) >= 5 else float(np.mean(recall))

    return out


def topk_table(df_scored: pd.DataFrame, k: int) -> pd.DataFrame:
    cols = ["tic_id", "score", "period_days", "duration_hours", "depth_ppm", "snr",
            "odd_even_depth_ratio", "secondary_snr", "data_fraction_kept"]
    got = [c for c in cols if c in df_scored.columns]
    return df_scored.sort_values("score", ascending=False)[got].head(k)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".", help="Project root containing processed/, interim/, artifacts/")
    ap.add_argument("--processed", default=None, help="Override processed/ path")
    ap.add_argument("--interim", default=None, help="Override interim/ path")
    ap.add_argument("--artifacts", default=None, help="Override artifacts/ path")
    ap.add_argument("--threshold", type=float, default=None, help="Optional decision threshold (0..1)")
    ap.add_argument("--topk", type=int, default=100, help="Export top-K table")
    ap.add_argument("--export", action="store_true", help="Write scored tables to interim/")
    args = ap.parse_args()

    root = Path(args.root).resolve()
    processed = Path(args.processed).resolve() if args.processed else root / "processed"
    interim = Path(args.interim).resolve() if args.interim else root / "interim"
    artifacts = Path(args.artifacts).resolve() if args.artifacts else root / "artifacts"

    feats_path = interim / "features_all.parquet"
    labels_path = processed / "labels.parquet"

    if not feats_path.exists():
        raise FileNotFoundError(f"Missing features_all: {feats_path}")
    if not labels_path.exists():
        raise FileNotFoundError(f"Missing labels: {labels_path}")
    if not (artifacts / "latest.txt").exists():
        raise FileNotFoundError(f"Missing latest.txt in artifacts: {artifacts}")

    feats = pd.read_parquet(feats_path).drop_duplicates("tic_id")
    labels = pd.read_parquet(labels_path).drop_duplicates("tic_id")
    df = feats.merge(labels, on="tic_id", how="inner")

    state = load_artifacts(artifacts)
    # Build X using ONLY feature columns saved at training time
    fn = state["feature_names"]
    X = df[fn].copy()
    y = df["label"].astype(int).to_numpy()
    scores = predict_scores(X, state)

    # Metrics
    metrics = compute_metrics(y, scores)
    metrics["n_rows"] = int(len(df))
    metrics["mode"] = state["mode"]
    print(json.dumps(metrics, indent=2))

    # Attach scores for export/inspection
    df_scored = df.copy()
    df_scored["score"] = scores

    # threshold summary (if provided and labels include 0/1)
    if args.threshold is not None and len(np.unique(y)) > 1:
        yhat = (scores >= float(args.threshold)).astype(int)
        from sklearn.metrics import confusion_matrix, precision_score, recall_score, f1_score
        tn, fp, fn_, tp = confusion_matrix(y, yhat).ravel()
        th_summary = {
            "threshold": float(args.threshold),
            "TP": int(tp), "FP": int(fp), "TN": int(tn), "FN": int(fn_),
            "precision": float(precision_score(y, yhat, zero_division=0)),
            "recall": float(recall_score(y, yhat, zero_division=0)),
            "f1": float(f1_score(y, yhat, zero_division=0))
        }
        print("Threshold summary:", json.dumps(th_summary, indent=2))

    # Top-K preview
    topk = topk_table(df_scored, args.topk)
    print("\nTop-K preview:")
    print(topk.head(min(10, len(topk))))

    # Exports
    if args.export:
        interim.mkdir(parents=True, exist_ok=True)
        (interim / "scored.parquet").write_bytes(df_scored.to_parquet(index=False))
        topk_path = interim / f"top_{args.topk}_candidates.csv"
        topk.to_csv(topk_path, index=False)
        print("Wrote:", interim / "scored.parquet")
        print("Wrote:", topk_path)


if __name__ == "__main__":
    main()
