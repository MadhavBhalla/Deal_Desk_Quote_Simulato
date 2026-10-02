import json
from pathlib import Path

from schemas import QuoteRequest


CATALOG_PATH = Path(__file__).resolve().parent.parent / "data" / "catalog.json"


def load_catalog():
    with open(CATALOG_PATH, "r") as file:
        return json.load(file)


def get_pricing_tier(seats: int, discount_rules: list):
    for rule in discount_rules:
        if rule["min_seats"] <= seats <= rule["max_seats"]:
            return rule

    raise ValueError("Invalid seat count")


def calculate_quote(quote: QuoteRequest):
    catalog = load_catalog()

    tier = get_pricing_tier(
        quote.seats,
        catalog["discount_rules"]
    )

    if quote.discount_pct > tier["max_discount_pct"]:
        raise ValueError(
            f"Discount cannot exceed {tier['max_discount_pct']}% "
            f"for {tier['code']} tier"
        )

    products = {
        product["sku"]: product
        for product in catalog["products"]
    }

    subtotal = 0
    line_items = []

    for item in quote.line_items:
        if item.sku not in products:
            raise ValueError(f"Unknown SKU: {item.sku}")

        product = products[item.sku]
        line_total = item.quantity * product["unit_price"]

        subtotal += line_total

        line_items.append({
            "sku": item.sku,
            "name": product["name"],
            "quantity": item.quantity,
            "unit_price": product["unit_price"],
            "line_total": line_total
        })

    discount_amount = subtotal * quote.discount_pct / 100
    total = subtotal - discount_amount

    approval_reasons = []

    if quote.discount_pct > 15:
        approval_reasons.append("discount_above_15_percent")

    if total > 25000:
        approval_reasons.append("total_above_25000")

    if quote.annual_commitment and quote.discount_pct > 10:
        approval_reasons.append(
            "annual_commitment_discount_above_10_percent"
        )

    return {
        "tier": tier["code"],
        "line_items": line_items,
        "subtotal": subtotal,
        "discount_amount": discount_amount,
        "total": total,
        "approval_required": len(approval_reasons) > 0,
        "approval_reasons": approval_reasons
    }