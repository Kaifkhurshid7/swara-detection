import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client(tmp_path_factory):
    with TestClient(app) as test_client:
        yield test_client


def test_health_check(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "success"


def test_analyze_rejects_non_png(client):
    response = client.post("/analyze", files={"file": ("x.jpg", b"data", "image/jpeg")})
    assert response.status_code == 400


def test_import_rejects_unknown_format(client):
    response = client.post("/import", json={"format": "abc", "content": ""})
    assert response.status_code == 400
