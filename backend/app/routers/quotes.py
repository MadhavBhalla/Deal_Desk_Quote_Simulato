from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.schemas.quote import (
    CalculatedQuote,
    QuoteDraft,
    SavedQuote,
    SavedQuoteSummary,
    StatusUpdate,
)
from app.services.quote_calculator import QuoteValidationError, calculate_quote
from app.repositories.quote_repository import (
    QuoteNotFoundError,
    get_quote,
    list_quotes,
    save_quote,
    update_quote,
)

router = APIRouter(prefix="/api/quotes")

# Allowed status transitions: current -> set of next statuses
ALLOWED_TRANSITIONS = {
    "draft": {"submitted"},
    "submitted": {"approved", "rejected"},
    "approved": set(),
    "rejected": set(),
}


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

@router.patch("/{quote_id}/status", response_model=SavedQuote)
def update_status(quote_id: str, update: StatusUpdate):
    """Update a saved quote's status using guarded transitions."""
    try:
        quote = get_quote(quote_id)
    except QuoteNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    allowed = ALLOWED_TRANSITIONS.get(quote["status"], set())
    if update.status not in allowed:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid transition from {quote['status']} to {update.status}.",
        )

    quote["status"] = update.status
    quote["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_quote(quote)
    return quote