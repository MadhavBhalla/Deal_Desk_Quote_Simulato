import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Ensure the backend root is importable (so import app... works).
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.main import app  # noqa: E402


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)