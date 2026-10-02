import json
from pathlib import Path

# backend/app/services/catalog.py -> backend/data/catalog.json
CATALOG_PATH = Path(__file__).resolve().parents[2] / "data" / "catalog.json"


class CatalogError(Exception):
    """Raised when the catalog file cannot be loaded."""


def load_catalog() -> dict:
    """Read and parse the catalog JSON file."""
    try:
        with CATALOG_PATH.open("r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError as exc:
        raise CatalogError("Catalog file not found.") from exc
    except json.JSONDecodeError as exc:
        raise CatalogError("Catalog file is not valid JSON.") from exc