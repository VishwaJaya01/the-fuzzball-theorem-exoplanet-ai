from __future__ import annotations

import math
import threading
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

from app.config import Settings
from app.dataaccess import lc_store
from app.features.bls import BLSResult, InsufficientDataError, build_bls_features
from app.logging import get_logger
from app.models import loader
from app.utils_time import elapsed_ms, monotonic_ms

LOGGER = get_logger(__name__)


class LightcurveNotFoundError(FileNotFoundError):
    """Raised when a TIC light curve parquet is unavailable."""


class FeatureExtractionError(RuntimeError):
    """Raised when feature computation fails for reasons other than data volume."""


class InferenceService:
    """Coordinates artifact loading, feature extraction, and scoring."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._lock = threading.RLock()
        self._state: Dict[str, Any] | None = None
        self.refresh(force=True)

    @property
    def settings(self) -> Settings:
        return self._settings

    def refresh(self, force: bool = False) -> Dict[str, Any]:
        with self._lock:
            latest_path = self._settings.model_dir / 'latest.txt'
            if not latest_path.exists():
                raise FileNotFoundError(f'latest.txt not found in {self._settings.model_dir}')
            current_mtime = latest_path.stat().st_mtime
            if force or self._state is None or current_mtime > float(self._state.get('latest_mtime', 0.0)):
                self._state = loader.load_state(self._settings)
            assert self._state is not None
            return self._state

    def version_info(self) -> Dict[str, Any]:
        state = self.refresh()
        return {
            'app': 'exoplanet-ai',
            'mode': state['mode'],
            'model': state['latest'],
            'is_probability': state['mode'] == 'supervised',
        }

    def model_info(self) -> Dict[str, Any]:
        state = self.refresh()
        return {
            'mode': state['mode'],
            'latest': state['latest'],
            'artifact_dir': str(self._settings.model_dir),
            'feature_names_version': state['feature_names_version'],
            'feature_count': len(state['feature_names']),
            'has_scaler': state['scaler'] is not None,
            'has_calibrator': state['calibrator'] is not None,
            'is_probability': state['mode'] == 'supervised',
        }

    def predict_by_tic(self, tic_id: int) -> Dict[str, Any]:
        state = self.refresh()
        start_ms = monotonic_ms()
        cache_hit = False
        auto_fetch = False

        try:
            time_arr, flux_arr, flux_err_arr = lc_store.get_lightcurve_by_tic(self._settings, tic_id)
        except FileNotFoundError as exc:
            if not self._settings.auto_fetch_missing:
                raise LightcurveNotFoundError(str(exc)) from exc
            try:
                lc_store.fetch_lightcurve_from_mast(self._settings, tic_id)
                auto_fetch = True
                time_arr, flux_arr, flux_err_arr = lc_store.get_lightcurve_by_tic(self._settings, tic_id)
            except Exception as fetch_exc:  # pragma: no cover - network heavy
                LOGGER.warning('auto_fetch_failed', extra={'tic_id': tic_id, 'error': str(fetch_exc)})
                raise LightcurveNotFoundError(str(fetch_exc)) from fetch_exc

        cached_features = None if auto_fetch else lc_store.read_cached_features(self._settings, tic_id)

        if cached_features is not None:
            features_series = cached_features.astype(float, copy=False)
            summary = self._summary_from_features(features_series)
            warnings: List[str] = []
            cache_hit = True
        else:
            try:
                bls_result = self._compute_features(
                    time=time_arr.tolist(),
                    flux=flux_arr.tolist(),
                    flux_err=flux_err_arr.tolist() if flux_err_arr is not None else None,
                )
            except InsufficientDataError:
                raise
            except Exception as exc:  # pragma: no cover - defensive path
                LOGGER.exception('Unexpected failure during TIC prediction', extra={'tic_id': tic_id})
                raise FeatureExtractionError(str(exc)) from exc

            features_series = bls_result.features
            summary = bls_result.summary
            warnings = bls_result.warnings
            lc_store.write_cached_features(self._settings, tic_id, features_series)

        lightcurve_payload = self._prepare_lightcurve(time_arr, flux_arr, flux_err_arr)

        response = self._score(
            features_series,
            summary,
            warnings,
            tic_id=tic_id,
            start_ms=start_ms,
            state=state,
            cache_hit=cache_hit,
            auto_fetch=auto_fetch,
            lightcurve=lightcurve_payload,
        )
        return response

    def predict_from_arrays(
        self,
        time: List[float],
        flux: List[float],
        flux_err: Optional[List[float]] = None,
        meta: Optional[Dict[str, float]] = None,
    ) -> Dict[str, Any]:
        state = self.refresh()
        start_ms = monotonic_ms()
        bls_result = self._compute_features(time=time, flux=flux, flux_err=flux_err, meta=meta)

        time_arr = np.asarray(time, dtype=float)
        flux_arr = np.asarray(flux, dtype=float)
        flux_err_arr = np.asarray(flux_err, dtype=float) if flux_err is not None else None
        lightcurve_payload = self._prepare_lightcurve(time_arr, flux_arr, flux_err_arr)

        return self._score(
            bls_result.features,
            bls_result.summary,
            bls_result.warnings,
            tic_id=None,
            start_ms=start_ms,
            state=state,
            cache_hit=False,
            auto_fetch=False,
            lightcurve=lightcurve_payload,
        )

    def _compute_features(
        self,
        time: List[float],
        flux: List[float],
        flux_err: Optional[List[float]] = None,
        meta: Optional[Dict[str, float]] = None,
    ) -> BLSResult:
        try:
            return build_bls_features(self._settings, time, flux, flux_err, meta)
        except InsufficientDataError:
            raise
        except Exception as exc:  # pragma: no cover - logging path
            LOGGER.exception('Failed to compute BLS features', extra={'size': len(time)})
            raise FeatureExtractionError(str(exc)) from exc

    def _score(
        self,
        features: pd.Series,
        summary: Dict[str, float],
        warnings: List[str],
        *,
        tic_id: Optional[int],
        start_ms: int,
        state: Dict[str, Any],
        cache_hit: Optional[bool],
        auto_fetch: bool,
        lightcurve: Optional[Dict[str, List[float]]],
    ) -> Dict[str, Any]:
        aligned = features.reindex(state['feature_names'])
        aligned = aligned.astype(float)
        matrix = aligned.to_frame().T
        X = matrix.to_numpy(dtype=np.float64)

        scaler = state['scaler']
        if scaler is not None:
            X_model = scaler.transform(X)
        else:
            X_model = X

        if state['mode'] == 'one_class':
            model = state['model']
            raw_score = float(model.decision_function(X_model)[0])
            score = float(np.clip(raw_score + 0.5, 0.0, 1.0))
            is_probability = False
        else:
            xgb_module = state['xgb']
            model = state['model']
            if xgb_module is None:
                raise RuntimeError('XGBoost module not loaded for supervised mode')
            dmatrix = xgb_module.DMatrix(X_model, feature_names=state['feature_names'])
            raw_output = model.predict(dmatrix)
            base_score = float(raw_output[0])
            calibrator = state['calibrator']
            if calibrator is not None:
                base_score = float(calibrator.predict_proba(X_model)[0, 1])
            score = float(np.clip(base_score, 0.0, 1.0))
            is_probability = True

        runtime = elapsed_ms(start_ms)
        features_payload = self._serialize_series(features)
        summary_payload = self._serialize_summary(summary)

        response: Dict[str, Any] = {
            'tic_id': tic_id,
            'mode': state['mode'],
            'is_probability': is_probability,
            'score': score,
            'summary': summary_payload,
            'features': features_payload,
            'warnings': warnings,
            'meta': {
                'artifact_dir': str(self._settings.model_dir),
                'feature_names_version': state['feature_names_version'],
                'runtime_ms': runtime,
            },
        }
        if cache_hit is not None:
            response['meta']['cache_hit'] = cache_hit
        response['meta']['auto_fetch'] = auto_fetch
        if lightcurve is not None:
            response['lightcurve'] = lightcurve

        LOGGER.info(
            'prediction_complete',
            extra={
                'tic_id': tic_id,
                'mode': state['mode'],
                'runtime_ms': runtime,
                'score': score,
                'cache_hit': cache_hit,
                'auto_fetch': auto_fetch,
            },
        )
        return response

    @staticmethod
    def _serialize_series(series: pd.Series) -> Dict[str, Optional[float]]:
        payload: Dict[str, Optional[float]] = {}
        for key, value in series.items():
            if pd.isna(value):
                payload[str(key)] = None
            else:
                payload[str(key)] = float(value)
        return payload

    @staticmethod
    def _serialize_summary(summary: Dict[str, float]) -> Dict[str, Optional[float]]:
        payload: Dict[str, Optional[float]] = {}
        for key, value in summary.items():
            if value is None or (isinstance(value, float) and (math.isnan(value) or math.isinf(value))):
                payload[str(key)] = None
            else:
                payload[str(key)] = float(value)
        return payload

    @staticmethod
    def _prepare_lightcurve(
        time: np.ndarray | None,
        flux: np.ndarray | None,
        flux_err: np.ndarray | None,
        *,
        max_points: int = 5000,
    ) -> Dict[str, List[float]]:
        if time is None or flux is None or time.size == 0 or flux.size == 0:
            return {'time': [], 'flux': []}

        indices = slice(None)
        if time.size > max_points:
            indices = np.linspace(0, time.size - 1, num=max_points, dtype=int)

        time_sampled = np.asarray(time)[indices]
        flux_sampled = np.asarray(flux)[indices]

        payload: Dict[str, List[float]] = {
            'time': [float(v) for v in time_sampled],
            'flux': [float(v) for v in flux_sampled],
        }

        if flux_err is not None and flux_err.size:
            flux_err_sampled = np.asarray(flux_err)[indices]
            payload['flux_err'] = [float(v) for v in flux_err_sampled]

        return payload

    @staticmethod
    def _summary_from_features(features: pd.Series) -> Dict[str, float]:
        return {
            'period_days': float(features.get('period_days', np.nan)),
            'duration_hours': float(features.get('duration_hours', np.nan)),
            'depth_ppm': float(features.get('depth_ppm', np.nan)),
            'snr': float(features.get('snr', np.nan)),
            't0_btjd': float(features.get('t0_btjd', np.nan)),
        }
