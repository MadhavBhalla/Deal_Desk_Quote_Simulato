from typing import Literal
from typing import List

from pydantic import BaseModel, Field


class QuoteLineInput(BaseModel):
    sku: str
    quantity: int


class QuoteDraft(BaseModel):
    customer_name: str
    seat_count: int
    discount_pct: float = 0
    annual_commitment: bool = False
    line_items: List[QuoteLineInput] = Field(default_factory=list)


class QuoteLine(BaseModel):
    sku: str
    name: str
    quantity: int
    unit_price: float
    line_total: float


class CalculatedQuote(BaseModel):
    customer_name: str
    seat_count: int
    tier: str
    currency: str
    discount_pct: float
    annual_commitment: bool
    line_items: List[QuoteLine]
    subtotal: float
    discount_amount: float
    total: float
    approval_required: bool
    approval_reasons: List[str]

class SavedQuote(CalculatedQuote):
    id: str
    status: str
    created_at: str
    updated_at: str


class SavedQuoteSummary(BaseModel):
    id: str
    customer_name: str
    seat_count: int
    total: float
    currency: str
    status: str
    approval_required: bool
    created_at: str
    updated_at: str

class StatusUpdate(BaseModel):
    status: Literal["draft", "submitted", "approved", "rejected"]
