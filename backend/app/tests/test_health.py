from fastapi.testclient import TestClient

from app.main import APP


client = TestClient(APP)


def test_health() -> None:
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json() == {'ok': True}
