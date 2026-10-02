from typing import Dict

from app.schemas.quote import CalculatedQuote, QuoteDraft, QuoteLine
from app.services.catalog import load_catalog

APPROVAL_DISCOUNT_PCT = 15
APPROVAL_TOTAL = 25000
ANNUAL_COMMITMENT_DISCOUNT_PCT = 10


class QuoteValidationError(Exception):
    """Raised when a quote draft is invalid."""


def resolve_tier(seat_count: int, discount_rules: list) -> dict:
    for rule in discount_rules:
        if rule["min_seats"] <= seat_count <= rule["max_seats"]:
            return rule
    raise QuoteValidationError(f"No pricing tier found for {seat_count} seats.")


def build_line(line_input, products_by_sku: Dict[str, dict]) -> QuoteLine:
    if line_input.quantity <= 0:
        raise QuoteValidationError("Quantity must be positive.")

    product = products_by_sku.get(line_input.sku)
    if product is None:
        raise QuoteValidationError(f"Unknown product SKU: {line_input.sku}")

    line_total = round(line_input.quantity * product["unit_price"], 2)
    return QuoteLine(
        sku=product["sku"],
        name=product["name"],
        quantity=line_input.quantity,
        unit_price=product["unit_price"],
        line_total=line_total,
    )


def evaluate_approval(
    discount_pct: float, total: float, annual_commitment: bool
) -> list[str]:
    reasons: list[str] = []

    if discount_pct > APPROVAL_DISCOUNT_PCT:
        reasons.append("discount_above_15_percent")
    if total > APPROVAL_TOTAL:
        reasons.append("total_above_25000")
    if annual_commitment and discount_pct > ANNUAL_COMMITMENT_DISCOUNT_PCT:
        reasons.append("annual_commitment_discount_above_10_percent")

    return reasons


def validate_draft(draft: QuoteDraft) -> None:
    if not draft.customer_name.strip():
        raise QuoteValidationError("Customer name is required.")
    if draft.seat_count <= 0:
        raise QuoteValidationError("Seat count must be positive.")
    if not draft.line_items:
        raise QuoteValidationError("At least one line item is required.")
    if draft.discount_pct < 0:
        raise QuoteValidationError("Discount must not be negative.")


def calculate_quote(draft: QuoteDraft) -> CalculatedQuote:
    validate_draft(draft)

    catalog = load_catalog()
    products_by_sku = {product["sku"]: product for product in catalog["products"]}

    tier = resolve_tier(draft.seat_count, catalog["discount_rules"])
    if draft.discount_pct > tier["max_discount_pct"]:
        raise QuoteValidationError(
            f"Discount exceeds the {tier['code']} tier maximum of {tier['max_discount_pct']}%."
        )

    line_items = [build_line(line, products_by_sku) for line in draft.line_items]

    subtotal = round(sum(line.line_total for line in line_items), 2)
    discount_amount = round(subtotal * draft.discount_pct / 100, 2)
    total = round(subtotal - discount_amount, 2)

    approval_reasons = evaluate_approval(
        draft.discount_pct, total, draft.annual_commitment
    )

    return CalculatedQuote(
        customer_name=draft.customer_name,
        seat_count=draft.seat_count,
        tier=tier["code"],
        currency=catalog["currency"],
        discount_pct=draft.discount_pct,
        annual_commitment=draft.annual_commitment,
        line_items=line_items,
        subtotal=subtotal,
        discount_amount=discount_amount,
        total=total,
        approval_required=bool(approval_reasons),
        approval_reasons=approval_reasons,
    )