from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Tuple

from pydantic import BaseModel, ConfigDict, Field, field_validator


class Settings(BaseModel):
    """Application configuration sourced from environment variables."""

    model_config = ConfigDict(frozen=True)

    model_dir: Path = Field(default=Path('/data/model'))
    processed_dir: Path = Field(default=Path('/data/processed'))
    interim_dir: Path = Field(default=Path('/data/interim'))
    period_min: float = Field(default=0.5, ge=0.01)
    period_max: float = Field(default=30.0, gt=0.5)
    n_periods: int = Field(default=5000, ge=100)
    dur_min_hours: float = Field(default=0.5, ge=0.1)
    dur_max_hours: float = Field(default=10.0, ge=0.5)
    allow_cors: Tuple[str, ...] = Field(default=('*',))
    log_level: str = Field(default='INFO')
    auto_fetch_missing: bool = Field(default=False)
    auto_fetch_author: str | None = Field(default='SPOC')
    auto_fetch_flux_column: str = Field(default='pdcsap_flux')

    @staticmethod
    def _parse_bool(value: str | bool) -> bool:
        if isinstance(value, bool):
            return value
        value_normalized = str(value).strip().lower()
        return value_normalized in {'1', 'true', 'yes', 'y', 'on'}

    @field_validator('model_dir', 'processed_dir', 'interim_dir', mode='before')
    @classmethod
    def _expand_path(cls, value: str | Path) -> Path:
        return Path(value).expanduser()

    @field_validator('allow_cors', mode='before')
    @classmethod
    def _parse_cors(cls, value: str | tuple[str, ...] | list[str]) -> Tuple[str, ...]:
        if value in (None, '', '*', ('*',), ['*']):
            return ('*',)
        if isinstance(value, str):
            items = [item.strip() for item in value.split(',') if item.strip()]
            return tuple(items) or ('*',)
        if isinstance(value, (tuple, list)):
            items = [str(item).strip() for item in value if str(item).strip()]
            return tuple(items) or ('*',)
        raise ValueError('Unable to parse ALLOW_CORS value')

    @classmethod
    def from_env(cls) -> 'Settings':
        return cls(
            model_dir=os.getenv('MODEL_DIR', '/data/model'),
            processed_dir=os.getenv('PROCESSED_DIR', '/data/processed'),
            interim_dir=os.getenv('INTERIM_DIR', '/data/interim'),
            period_min=float(os.getenv('PERIOD_MIN', 0.5)),
            period_max=float(os.getenv('PERIOD_MAX', 30.0)),
            n_periods=int(os.getenv('N_PERIODS', 5000)),
            dur_min_hours=float(os.getenv('DUR_MIN_H', 0.5)),
            dur_max_hours=float(os.getenv('DUR_MAX_H', 10.0)),
            allow_cors=os.getenv('ALLOW_CORS', '*'),
            log_level=os.getenv('LOG_LEVEL', 'INFO'),
            auto_fetch_missing=cls._parse_bool(os.getenv('AUTO_FETCH_MISSING', '0')),
            auto_fetch_author=os.getenv('AUTO_FETCH_AUTHOR', 'SPOC') or None,
            auto_fetch_flux_column=os.getenv('AUTO_FETCH_FLUX', 'pdcsap_flux') or 'pdcsap_flux',
        )


@lru_cache(1)
def get_settings() -> Settings:
    return Settings.from_env()


settings = get_settings()
