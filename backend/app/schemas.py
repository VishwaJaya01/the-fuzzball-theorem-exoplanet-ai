from __future__ import annotations

from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, NonNegativeInt, model_validator


class HealthResponse(BaseModel):
    ok: bool = True


class VersionResponse(BaseModel):
    app: str = Field(default='exoplanet-ai')
    mode: Literal['one_class', 'supervised']
    model: str
    is_probability: bool


class ModelInfoResponse(BaseModel):
    mode: Literal['one_class', 'supervised']
    latest: str
    artifact_dir: str
    feature_names_version: str
    feature_count: NonNegativeInt
    has_scaler: bool
    has_calibrator: bool
    is_probability: bool


class LightcurvePayload(BaseModel):
    time: List[float]
    flux: List[float]
    flux_err: Optional[List[float]] = None
    meta: Optional[Dict[str, float]] = None

    model_config = ConfigDict(extra='forbid')

    @model_validator(mode='after')
    def _ensure_samples(self) -> 'LightcurvePayload':
        if len(self.time) < 2 or len(self.flux) < 2:
            raise ValueError('lightcurve must contain at least two samples')
        return self


class PredictionSummary(BaseModel):
    period_days: Optional[float]
    duration_hours: Optional[float]
    depth_ppm: Optional[float]
    snr: Optional[float]
    t0_btjd: Optional[float]


class PredictionMeta(BaseModel):
    artifact_dir: str
    feature_names_version: str
    runtime_ms: int


class LightcurveSeries(BaseModel):
    time: List[float]
    flux: List[float]
    flux_err: Optional[List[float]] = None

    model_config = ConfigDict(extra='forbid')

    @model_validator(mode='after')
    def _validate_lengths(self) -> 'LightcurveSeries':
        if len(self.time) != len(self.flux):
            raise ValueError('time and flux must have identical lengths')
        if self.flux_err is not None and len(self.flux_err) != len(self.time):
            raise ValueError('flux_err must match time length when provided')
        return self


class PredictionResponse(BaseModel):
    tic_id: Optional[int] = None
    mode: Literal['one_class', 'supervised']
    is_probability: bool
    score: float
    summary: PredictionSummary
    features: Dict[str, Optional[float]]
    warnings: List[str]
    meta: PredictionMeta
    lightcurve: Optional[LightcurveSeries] = None

    model_config = ConfigDict(extra='forbid')
