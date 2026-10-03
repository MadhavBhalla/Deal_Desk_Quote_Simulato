# Decisions

These answers describe the current implementation exactly, not an idealized design.

## 1. What happens if the same product is added twice?

Each line item is treated independently. If the same SKU appears in two rows,
the backend prices each row separately and returns two distinct line items; it
does not merge them into a single combined quantity. The subtotal is still
correct because it sums all line totals, so duplicate rows simply show up as
separate lines that add together.

## 2. Is a 0% discount represented as `0` or omitted?

As `0`. `discount_pct` is an explicit numeric field that defaults to `0` on the
quote draft (both in the frontend form state and the backend schema). It is
never omitted. A `0` discount produces `discount_amount = 0` and a total equal
to the subtotal.

## 3. How do you handle money/rounding and why?

Money is handled as plain numbers and rounded to 2 decimal places using
Python's built-in `round()` at each step in the backend calculator: each
`line_total`, then `subtotal`, then `discount_amount`, then `total`. Rounding
lives only on the backend so the API is the single source of truth for money
values. The catalog prices are whole-dollar integers, so in practice rounding
mainly matters for the percentage-based discount. This keeps the implementation
simple and readable; a stricter approach (integer cents or `Decimal`) would be
the next step if fractional-cent precision became important (see "With another
day").

## 4. Does annual commitment change pricing, or only approval logic?

Only approval logic. `annual_commitment` never changes subtotal, discount, or
total. It only participates in the approval check: if annual commitment is
selected and the discount is above 10%, approval is required
(`annual_commitment_discount_above_10_percent`).

## 5. What happens if a product disappears from the catalog after a saved quote was created?

Saved quotes are unaffected. When a quote is saved, the full calculated result
is persisted, including each line item's `sku`, `name`, `unit_price`, and
`line_total`, along with tier, currency, and totals. Reading a saved quote
(`GET /api/quotes/{id}`) returns this stored snapshot and never recalculates
from the live catalog, so a later catalog change (including a removed product)
does not alter or break previously saved quotes.

## 6. Where should business rules live so the frontend and backend cannot disagree?

In the backend. All pricing, tier resolution, discount limits, and approval
rules are implemented once in the backend quote calculator and exposed through
`POST /api/quotes/calculate`. The frontend never computes totals itself; it
sends the draft and renders whatever the API returns. This guarantees the
preview, the saved quote, and the authoritative calculation always agree.

## 7. Which status transitions are allowed?

The backend enforces an explicit transition map:

- `draft -> submitted`
- `submitted -> approved`
- `submitted -> rejected`

`approved` and `rejected` are terminal (no further transitions). Any other
transition (for example `draft -> approved`, `approved -> rejected`, or
`rejected -> submitted`) is rejected with an error. The frontend only shows
action buttons for the transitions that are valid for the quote's current
status, but the backend is the authority and validates every change.

## What I noticed

- Keeping all money and approval logic on the backend made the frontend much
  simpler and removed any chance of the preview disagreeing with the saved
  result.
- Storing a full snapshot on save (rather than only SKU references) was the key
  decision that makes saved quotes stable against catalog changes.
- The quote builder currently accepts a SKU as free text rather than a product
  dropdown sourced from `GET /api/catalog`; unknown SKUs are caught by the
  backend and returned as a clear validation error.

## With another day

- Represent money as integer cents or `Decimal` in the backend to avoid any
  floating-point rounding edge cases.
- Replace the free-text SKU input with a product picker populated from
  `GET /api/catalog`, and surface the backend's specific validation messages in
  the UI instead of a generic error.
- Add a frontend test for the quote builder, and consider merging duplicate SKUs
  into a single line (or explicitly warning) if that matches the desired UX.