from pydantic import BaseModel, Field
from typing import List


class QuoteLineItem(BaseModel):
    sku: str
    quantity: int = Field(gt=0)


class QuoteRequest(BaseModel):
    customer_name: str
    seats: int = Field(gt=0)
    line_items: List[QuoteLineItem]
    discount_pct: float = Field(ge=0)
    annual_commitment: bool = False