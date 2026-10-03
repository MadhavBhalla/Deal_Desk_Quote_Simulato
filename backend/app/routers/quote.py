from fastapi import APIRouter, HTTPException

from app.schemas.quote import CalculatedQuote, QuoteDraft
from app.services.quote_calculator import QuoteValidationError, calculate_quote

router = APIRouter(prefix="/api/quotes")


@router.post("/calculate", response_model=CalculatedQuote)
def calculate(draft: QuoteDraft):
    """Calculate a priced quote from a draft without saving it."""
    try:
        return calculate_quote(draft)
    except QuoteValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc))