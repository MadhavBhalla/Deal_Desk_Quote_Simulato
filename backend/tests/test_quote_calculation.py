"""Business-rule and validation tests for the quote calculation API.

These exercise POST /api/quotes/calculate, which returns the authoritative
calculation and surfaces validation errors as HTTP 422.
"""

CALCULATE_URL = "/api/quotes/calculate"


def draft(**overrides):
    """Build a valid quote draft, with optional field overrides."""
    base = {
        "customer_name": "Acme",
        "seat_count": 10,
        "discount_pct": 0,
        "annual_commitment": False,
        "line_items": [{"sku": "AGENT-CORE", "quantity": 1}],
    }
    base.update(overrides)
    return base


# --- Pricing / business rules -------------------------------------------------


def test_subtotal_discount_and_total(client):
    # 10 x AGENT-CORE (120) = 1200 subtotal; 10% discount -> 120 off -> 1080.
    response = client.post(
        CALCULATE_URL,
        json=draft(
            seat_count=10,
            discount_pct=10,
            line_items=[{"sku": "AGENT-CORE", "quantity": 10}],
        ),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["subtotal"] == 1200
    assert body["discount_amount"] == 120
    assert body["total"] == 1080
    assert body["tier"] == "GROWTH"


def test_approval_required_when_discount_above_15_percent(client):
    response = client.post(
        CALCULATE_URL,
        json=draft(
            seat_count=50,  # ENTERPRISE allows up to 30%
            discount_pct=20,
            line_items=[{"sku": "AGENT-CORE", "quantity": 1}],
        ),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["approval_required"] is True
    assert "discount_above_15_percent" in body["approval_reasons"]


def test_approval_required_when_total_above_25000(client):
    # 11 x ONBOARDING (2500) = 27500 subtotal, no discount.
    response = client.post(
        CALCULATE_URL,
        json=draft(
            seat_count=50,
            discount_pct=0,
            line_items=[{"sku": "ONBOARDING", "quantity": 11}],
        ),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 27500
    assert body["approval_required"] is True
    assert "total_above_25000" in body["approval_reasons"]


def test_approval_required_for_annual_commitment_above_10_percent(client):
    # 12% discount with annual commitment, but not above 15% and total low:
    # approval should be driven solely by the annual-commitment rule.
    response = client.post(
        CALCULATE_URL,
        json=draft(
            seat_count=10,  # GROWTH allows up to 20%
            discount_pct=12,
            annual_commitment=True,
            line_items=[{"sku": "AGENT-CORE", "quantity": 1}],
        ),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["approval_required"] is True
    assert body["approval_reasons"] == ["annual_commitment_discount_above_10_percent"]


def test_no_approval_when_within_all_limits(client):
    response = client.post(
        CALCULATE_URL,
        json=draft(
            seat_count=10,
            discount_pct=10,
            annual_commitment=False,
            line_items=[{"sku": "AGENT-CORE", "quantity": 1}],
        ),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["approval_required"] is False
    assert body["approval_reasons"] == []


# --- Tier boundary behaviour --------------------------------------------------


def test_tier_boundary_9_vs_10_seats(client):
    starter = client.post(CALCULATE_URL, json=draft(seat_count=9))
    growth = client.post(CALCULATE_URL, json=draft(seat_count=10))
    assert starter.status_code == 200
    assert growth.status_code == 200
    assert starter.json()["tier"] == "STARTER"
    assert growth.json()["tier"] == "GROWTH"


def test_tier_boundary_49_vs_50_seats(client):
    growth = client.post(CALCULATE_URL, json=draft(seat_count=49))
    enterprise = client.post(CALCULATE_URL, json=draft(seat_count=50))
    assert growth.status_code == 200
    assert enterprise.status_code == 200
    assert growth.json()["tier"] == "GROWTH"
    assert enterprise.json()["tier"] == "ENTERPRISE"


def test_discount_above_tier_maximum_is_rejected(client):
    # STARTER max discount is 10%; 15% must be rejected.
    response = client.post(
        CALCULATE_URL,
        json=draft(seat_count=5, discount_pct=15),
    )
    assert response.status_code == 422
    assert "STARTER" in response.json()["detail"]


# --- Validation / error handling ---------------------------------------------


def test_unknown_sku_returns_validation_error(client):
    response = client.post(
        CALCULATE_URL,
        json=draft(line_items=[{"sku": "NOPE", "quantity": 1}]),
    )
    assert response.status_code == 422
    assert "NOPE" in response.json()["detail"]


def test_non_positive_quantity_returns_validation_error(client):
    response = client.post(
        CALCULATE_URL,
        json=draft(line_items=[{"sku": "AGENT-CORE", "quantity": 0}]),
    )
    assert response.status_code == 422


def test_no_line_items_returns_validation_error(client):
    response = client.post(CALCULATE_URL, json=draft(line_items=[]))
    assert response.status_code == 422


def test_invalid_seat_count_returns_validation_error(client):
    response = client.post(CALCULATE_URL, json=draft(seat_count=0))
    assert response.status_code == 422