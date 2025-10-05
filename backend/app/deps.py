from __future__ import annotations

import threading

from app.config import Settings, get_settings
from app.models.infer import InferenceService


_service: InferenceService | None = None
_service_lock = threading.Lock()


def provide_settings() -> Settings:
    return get_settings()


def get_inference_service() -> InferenceService:
    global _service
    if _service is None:
        with _service_lock:
            if _service is None:
                _service = InferenceService(get_settings())
    return _service
