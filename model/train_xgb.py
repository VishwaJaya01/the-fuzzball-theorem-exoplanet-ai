
"""
Supervised trainer (CPU-only XGBoost) for when negatives (label=0) are available.

Usage (Colab/CLI):
  python -m model.train_xgb --features /path/interim/features_all.parquet \
                            --labels   /path/processed/labels.parquet \
                            --artifacts /path/artifacts \
                            --version v1
"""
from __future__ import annotations
import argparse, json, time, joblib, numpy as np, pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.metrics import average_precision_score, roc_auc_score
from sklearn.calibration import CalibratedClassifierCV
import xgboost as xgb

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--features", required=True)
    ap.add_argument("--labels", required=True)
    ap.add_argument("--artifacts", required=True)
    ap.add_argument("--version", default="v1")
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    feats  = pd.read_parquet(args.features).drop_duplicates("tic_id")
    labels = pd.read_parquet(args.labels).drop_duplicates("tic_id")
    df = feats.merge(labels, on="tic_id", how="inner")
    if not (df["label"].isin([0,1])).all():
        raise ValueError("labels must be 0/1 for supervised training")

    non_feature = {"tic_id","warning","t0","label"}
    feature_names = [c for c in df.columns if c not in non_feature]
    X = df[feature_names].fillna(df[feature_names].median())
    y = df["label"].astype(int).to_numpy()

    train_idx, temp_idx = train_test_split(df.index, test_size=0.30, random_state=args.seed, stratify=y)
    val_idx,   test_idx = train_test_split(temp_idx,  test_size=0.50, random_state=args.seed+1, stratify=y[temp_idx])

    Xtr, ytr = X.iloc[train_idx], y[train_idx]
    Xva, yva = X.iloc[val_idx],   y[val_idx]
    Xte, yte = X.iloc[test_idx],  y[test_idx]

    dtr = xgb.DMatrix(Xtr, label=ytr, feature_names=feature_names)
    dva = xgb.DMatrix(Xva, label=yva, feature_names=feature_names)
    dte = xgb.DMatrix(Xte, label=yte, feature_names=feature_names)

    pos = int((ytr==1).sum()); neg = int((ytr==0).sum())
    spw = max(1.0, neg/pos) if pos>0 else 1.0

    params = dict(
        max_depth=5, eta=0.05, nthread=0,
        objective="binary:logistic", subsample=0.9, colsample_bytree=0.8,
        min_child_weight=1.0, reg_lambda=1.0, tree_method="hist",
        scale_pos_weight=spw, eval_metric="aucpr"
    )
    bst = xgb.train(params, dtr, num_boost_round=2000, evals=[(dtr,"train"),(dva,"val")],
                    early_stopping_rounds=100, verbose_eval=50)

    p_va  = bst.predict(dva)
    p_te  = bst.predict(dte)
    metrics = {
        "AUPRC_val": float(average_precision_score(yva, p_va)),
        "ROC_AUC_val": float(roc_auc_score(yva, p_va)),
        "AUPRC_test": float(average_precision_score(yte, p_te)),
        "ROC_AUC_test": float(roc_auc_score(yte, p_te)),
        "best_iteration": int(bst.best_iteration)
    }

    # calibrate (Platt)
    class _XGBWrapper:
        def __init__(self, booster, feature_names): self.booster=booster; self.feature_names=feature_names
        def fit(self, X, y): return self
        def predict_proba(self, X):
            dm = xgb.DMatrix(X[self.feature_names], feature_names=self.feature_names)
            p = self.booster.predict(dm)
            return np.c_[1-p, p]

    wrapper = _XGBWrapper(bst, feature_names)
    calib = CalibratedClassifierCV(wrapper, method="sigmoid", cv="prefit")
    calib.fit(Xva, yva)

    arti = Path(args.artifacts); arti.mkdir(parents=True, exist_ok=True)
    ver = args.version
    joblib.dump(bst,   arti / f"model_xgb_{ver}.pkl")
    joblib.dump(calib, arti / f"calibrator_{ver}.pkl")
    with open(arti / f"feature_names_{ver}.json","w") as f: json.dump(feature_names, f)
    with open(arti / f"metrics_{ver}.json","w") as f: json.dump(metrics, f, indent=2)
    with open(arti / "latest.txt","w") as f: f.write(f"model_xgb_{ver}.pkl")
    print("Saved artifacts to:", arti, "|", metrics)

if __name__ == "__main__":
    main()
