from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.schemas.quote import (
    CalculatedQuote, 
    QuoteDraft,
    SavedQuote,
    SavedQuoteSummary,
)
from app.services.quote_calculator import QuoteValidationError, calculate_quote
from app.repositories.quote_repository import (
    QuoteNotFoundError,
    get_quote,
    list_quotes,
    save_quote,
)

router = APIRouter(prefix="/api/quotes")


@router.post("/calculate", response_model=CalculatedQuote)
def calculate(draft: QuoteDraft):
    """Calculate a priced quote from a draft without saving it."""
    try:
        return calculate_quote(draft)
    except QuoteValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

@router.post("", response_model=SavedQuote, status_code=201)
def create_quote(draft: QuoteDraft):
    """Validate, calculate, and save a new quote."""
    try:
        calculated = calculate_quote(draft)
    except QuoteValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    now = datetime.now(timezone.utc).isoformat()
    saved = SavedQuote(
        id=str(uuid4()),
        status="draft",
        created_at=now,
        updated_at=now,
        **calculated.model_dump(),
    )
    save_quote(saved.model_dump())
    return saved


@router.get("", response_model=list[SavedQuoteSummary])
def get_quotes():
    """Return summaries of all saved quotes."""
    quotes = list_quotes()
    return [
        SavedQuoteSummary(
            id=quote["id"],
            customer_name=quote["customer_name"],
            seat_count=quote["seat_count"],
            total=quote["total"],
            currency=quote["currency"],
            status=quote["status"],
            approval_required=quote["approval_required"],
            created_at=quote["created_at"],
            updated_at=quote["updated_at"],
        )
        for quote in quotes
    ]


@router.get("/{quote_id}", response_model=SavedQuote)
def get_single_quote(quote_id: str):
    """Return a saved quote with its calculated result."""
    try:
        return get_quote(quote_id)
    except QuoteNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))