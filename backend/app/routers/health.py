from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health():
    """Basic liveness check."""
    return {"status": "ok"}
