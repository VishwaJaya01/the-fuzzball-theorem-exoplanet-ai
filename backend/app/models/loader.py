from __future__ import annotations

import json
from importlib import import_module
from pathlib import Path
from types import ModuleType
from typing import Any, Dict, Literal

import joblib

from app.config import Settings


Mode = Literal['one_class', 'supervised']


def _load_feature_names(path: Path) -> list[str]:
    with path.open('r', encoding='utf-8') as fp:
        data = json.load(fp)
    if isinstance(data, dict):
        return list(data.get('feature_names', []))
    if isinstance(data, list):
        return [str(item) for item in data]
    raise ValueError(f'Unsupported feature names format in {path}')


def _resolve_suffix(latest: str, prefix: str) -> str:
    stem = Path(latest).stem
    if not stem.startswith(prefix):
        raise ValueError(f'Expected latest artifact to start with {prefix}, got {latest}')
    return stem.removeprefix(prefix)


def load_state(settings: Settings) -> Dict[str, Any]:
    """Load the most recent model artifacts from MODEL_DIR."""
    model_dir = settings.model_dir
    model_dir.mkdir(parents=True, exist_ok=True)

    latest_path = model_dir / 'latest.txt'
    if not latest_path.exists():
        raise FileNotFoundError(f'latest.txt not found in {model_dir}')

    latest = latest_path.read_text(encoding='utf-8').strip()
    if not latest:
        raise ValueError('latest.txt is empty')

    model_path = model_dir / latest
    if not model_path.exists():
        raise FileNotFoundError(f'Model artifact {latest} missing in {model_dir}')

    if latest.startswith('model_iso_'):
        mode: Mode = 'one_class'
        suffix = _resolve_suffix(latest, 'model_iso_')
        suffix = suffix.split('.')[0]
        feature_path = model_dir / f'feature_names_{suffix}.json'
        scaler_path = model_dir / f'scaler_{suffix}.pkl'
        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path) if scaler_path.exists() else None
        calibrator = None
        xgb_module = None
    elif latest.startswith('model_xgb_'):
        mode = 'supervised'
        suffix = _resolve_suffix(latest, 'model_xgb_')
        suffix = suffix.split('.')[0]
        feature_path = model_dir / f'feature_names_{suffix}.json'
        scaler_path = model_dir / f'scaler_{suffix}.pkl'
        calibrator_path = model_dir / f'calibrator_{suffix}.pkl'
        xgb_module: ModuleType | None = None
        try:
            xgb_module = import_module('xgboost')
        except ModuleNotFoundError as exc:  # pragma: no cover - optional dep
            raise RuntimeError('xgboost must be installed for supervised mode') from exc

        model: Any
        if model_path.suffix.lower() in {'.json', '.ubj', '.bin'}:
            booster = xgb_module.Booster()
            booster.load_model(str(model_path))
            model = booster
        else:
            model = joblib.load(model_path)
            if not isinstance(model, xgb_module.Booster):  # pragma: no cover - defensive
                raise TypeError('Loaded supervised model is not an XGBoost Booster instance')
        scaler = joblib.load(scaler_path) if scaler_path.exists() else None
        calibrator = joblib.load(calibrator_path) if calibrator_path.exists() else None
    else:
        raise ValueError(f'Unsupported latest artifact name: {latest}')

    if not feature_path.exists():
        raise FileNotFoundError(f'Feature names file missing: {feature_path}')

    feature_names = _load_feature_names(feature_path)
    if not feature_names:
        raise ValueError('Loaded feature names list is empty')

    state = {
        'mode': mode,
        'feature_names': feature_names,
        'model': model,
        'scaler': scaler,
        'calibrator': calibrator,
        'xgb': xgb_module if latest.startswith('model_xgb_') else None,
        'latest': latest,
        'model_path': model_path,
        'feature_names_path': feature_path,
        'feature_names_version': feature_path.stem.removeprefix('feature_names_'),
        'latest_mtime': latest_path.stat().st_mtime,
    }
    return state
