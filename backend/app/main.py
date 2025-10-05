from __future__ import annotations

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.deps import get_inference_service
from app.logging import configure_logging
from app.models.infer import (
    FeatureExtractionError,
    InferenceService,
    InsufficientDataError,
    LightcurveNotFoundError,
)
from app.schemas import (
    HealthResponse,
    LightcurvePayload,
    ModelInfoResponse,
    PredictionResponse,
    VersionResponse,
)

configure_logging(settings.log_level)

APP = FastAPI(title='Exoplanet AI Backend', version='1.0.0')

cors_origins = list(settings.allow_cors)
APP.add_middleware(
    CORSMiddleware,
    allow_origins=['*'] if cors_origins == ['*'] else cors_origins,
    allow_credentials=False,
    allow_methods=['*'],
    allow_headers=['*'],
)


@APP.on_event('startup')
async def _startup() -> None:
    service = get_inference_service()
    service.refresh(force=True)


@APP.get('/health', response_model=HealthResponse)
def healthcheck() -> HealthResponse:
    return HealthResponse(ok=True)


@APP.get('/version', response_model=VersionResponse)
def version(service: InferenceService = Depends(get_inference_service)) -> VersionResponse:
    info = service.version_info()
    return VersionResponse(**info)


@APP.get('/model/info', response_model=ModelInfoResponse)
def model_info(service: InferenceService = Depends(get_inference_service)) -> ModelInfoResponse:
    info = service.model_info()
    return ModelInfoResponse(**info)


@APP.get('/predict/by_tic', response_model=PredictionResponse)
def predict_by_tic(
    tic_id: int = Query(..., ge=1),
    service: InferenceService = Depends(get_inference_service),
) -> PredictionResponse:
    try:
        payload = service.predict_by_tic(tic_id)
        return PredictionResponse(**payload)
    except LightcurveNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except InsufficientDataError:
        raise HTTPException(status_code=422, detail={'message': 'insufficient_data', 'warnings': ['insufficient_data']})
    except FeatureExtractionError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@APP.post('/predict/from_lightcurve', response_model=PredictionResponse)
def predict_from_lightcurve(
    payload: LightcurvePayload,
    service: InferenceService = Depends(get_inference_service),
) -> PredictionResponse:
    if len(payload.time) != len(payload.flux):
        raise HTTPException(status_code=400, detail='time and flux length mismatch')
    if payload.flux_err is not None and len(payload.flux_err) != len(payload.time):
        raise HTTPException(status_code=400, detail='flux_err length mismatch')

    try:
        response = service.predict_from_arrays(
            time=payload.time,
            flux=payload.flux,
            flux_err=payload.flux_err,
            meta=payload.meta,
        )
        return PredictionResponse(**response)
    except InsufficientDataError:
        raise HTTPException(status_code=422, detail={'message': 'insufficient_data', 'warnings': ['insufficient_data']})
    except FeatureExtractionError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
