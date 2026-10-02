from fastapi import APIRouter, HTTPException

from app.services.catalog import CatalogError, load_catalog

router = APIRouter(prefix="/api")


@router.get("/catalog")
def get_catalog():
    """Return currency, discount rules, and products from the catalog."""
    try:
        return load_catalog()
    except CatalogError as exc:
        raise HTTPException(status_code=500, detail=str(exc))