# Deal Desk Quote Simulator

A small full-stack take-home project.
A small full-stack app for building, pricing, and reviewing sales quotes. A user
enters deal details (customer, seats, discount, products), gets a live price
calculation with tier-based discount limits and approval flags, and can save the
quote and move it through a simple review workflow (draft → submitted →
approved/rejected).

- **frontend/** — Next.js + TypeScript (App Router) UI
- **backend/** — Python FastAPI service (HTTP API)

The two apps run separately and communicate over HTTP.
The two apps run separately and communicate over HTTP. There is no database;
catalog data is read from a JSON file and saved quotes are persisted to a local
JSON file.

## What it does

- Prices a quote from a product catalog (currency, products, discount tiers).
- Resolves a seat-based pricing tier (STARTER / GROWTH / ENTERPRISE) and enforces
  each tier's maximum discount.
- Calculates line totals, subtotal, discount amount, and total.
- Flags when a quote requires approval and lists the reasons.
- Saves quotes and supports guarded status transitions.

## Main user flow

1. Open the quote builder and enter customer name, seat count, discount
   percentage, annual commitment, and one or more line items (SKU + quantity).
2. Click **Calculate** to preview pricing and approval requirements.
3. Click **Save Quote** to persist it (status starts as `draft`).
4. Open the saved quotes list, then a quote's detail page.
5. Advance the quote's status: `draft → submitted`, then
   `submitted → approved` or `submitted → rejected`.

## Features

- Catalog API: `GET /api/catalog`
- Quote calculation: `POST /api/quotes/calculate`
- Save and retrieve quotes: `POST /api/quotes`, `GET /api/quotes`,
  `GET /api/quotes/{id}`
- Guarded status transitions: `PATCH /api/quotes/{id}/status`
- Frontend pages: home, quote builder with live preview, saved quotes list,
  and quote detail with status actions

## Project structure

```
backend/
  app/
    main.py            # FastAPI app + router registration
    routers/           # catalog, health, quotes endpoints
    services/          # quote calculation, catalog loading
    repositories/      # JSON file persistence for saved quotes
    schemas/           # Pydantic request/response models
  data/
    catalog.json       # source catalog (currency, discount rules, products)
frontend/
  src/
    app/               # App Router pages (home, quote, quotes, quotes/[id])
    components/         # reusable UI (LineItemRow)
    lib/               # formatting helpers
    types/             # shared TypeScript types
```

## Requirements

- Python 3.10+
- Node.js 18+

## Environment variables

Example values are provided in `.env.example` (root), `backend/.env.example`,
and `frontend/.env.example`.

- `NEXT_PUBLIC_API_BASE_URL` (frontend) — base URL of the backend API.
  Defaults to `http://localhost:8000` if not set.
- `BACKEND_HOST` / `BACKEND_PORT` (backend) — host and port for the server.

For local development the defaults work without creating any `.env` files.

## Getting started

Run the backend and frontend in two separate terminals.

### Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Health check: http://localhost:8000/health

- API: http://localhost:8000
- Health check: http://localhost:8000/health
- Interactive API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```
App: http://localhost:3000

- App: http://localhost:3000

Make sure the backend is running so the frontend can calculate and save quotes.

## Manually testing the quote workflow

1. Start both servers (see above) and open http://localhost:3000.
2. Go to **Build a quote** and enter:
   - Customer name: `Acme`
   - Seat count: `12`
   - Discount percentage: `10`
   - A line item, e.g. SKU `AGENT-CORE` with quantity `5`
   (Available SKUs come from `backend/data/catalog.json`.)
3. Click **Calculate** and confirm the preview shows the tier, totals, and
   approval status.
4. Click **Save Quote** and note the returned quote id and `draft` status.
5. Open **View saved quotes**, then open the saved quote's detail page.
6. Use the status actions to move the quote `draft → submitted`, then
   `submitted → approved` or `rejected`, and confirm the status updates.

To verify discount guardrails, try a discount above the tier maximum (e.g. a
STARTER quote with 1–9 seats and a discount above 10%) and confirm the API
returns a clear validation error.