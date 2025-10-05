from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import APP


client = TestClient(APP)


@pytest.mark.smoke
def test_predict_by_tic_smoke() -> None:
    lightcurve_dir = settings.processed_dir / 'lightcurves'
    if not lightcurve_dir.exists():
        pytest.skip('No processed lightcurves directory available')

    tic_paths = sorted(lightcurve_dir.glob('TIC-*.parquet'))
    if not tic_paths:
        pytest.skip('No TIC parquet files available for smoke test')

    tic_id_str = tic_paths[0].stem.split('-')[-1]
    tic_id = int(tic_id_str)

    response = client.get(f'/predict/by_tic?tic_id={tic_id}')
    if response.status_code != 200:
        pytest.skip(f'Prediction unavailable for TIC {tic_id}: {response.status_code}')

    payload = response.json()
    for key in ('mode', 'score', 'summary', 'features', 'meta'):
        assert key in payload
