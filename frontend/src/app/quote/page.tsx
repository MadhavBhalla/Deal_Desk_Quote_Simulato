"use client";

import { useEffect, useState } from "react";
import LineItemRow, { LineItem } from "@/components/LineItemRow";
import { CalculatedQuote,Catalog, Product, SavedQuote } from "@/types/quote";
import {
  formatApprovalReason,
  formatDateTime,
  formatMoney,
  formatStatus,
} from "@/lib/format";

const emptyLineItem: LineItem = { sku: "", quantity: 1 };

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

// Extract a readable message from a backend error response. FastAPI returns
// detail as either a string (our business errors) or an array of validation
// objects (schema errors).
async function readErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = await response.json();
    const detail = body?.detail;
    if (typeof detail === "string") {
      return detail;
    }
    if (Array.isArray(detail)) {
      return detail.map((d) => d?.msg ?? JSON.stringify(d)).join(" ");
    }
  } catch {
    // ignore parse errors and use the fallback
  }
  return fallback;
}

export default function QuoteBuilderPage() {
  const [customerName, setCustomerName] = useState("");
  const [seatCount, setSeatCount] = useState(1);
  const [discountPct, setDiscountPct] = useState(0);
  const [annualCommitment, setAnnualCommitment] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { ...emptyLineItem },
  ]);
  const [products, setProducts] = useState<Product[]>([]);
  const [result, setResult] = useState<CalculatedQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [savedQuote, setSavedQuote] = useState<SavedQuote | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/catalog`);
        if (!response.ok) {
          return;
        }
        const data: Catalog = await response.json();
        setProducts(data.products ?? []);
      } catch {
        // Leave products empty; calculation errors will still surface clearly.
      }
    }

    loadCatalog();
  }, []);

  function updateLineItem(index: number, item: LineItem) {
    setLineItems((items) => items.map((it, i) => (i === index ? item : it)));
  }

  function addLineItem() {
    setLineItems((items) => [...items, { ...emptyLineItem }]);
  }

  function removeLineItem(index: number) {
    setLineItems((items) => items.filter((_, i) => i !== index));
  }

  function buildPayload() {
    return {
      customer_name: customerName,
      seat_count: seatCount,
      discount_pct: discountPct,
      annual_commitment: annualCommitment,
      line_items: lineItems
        .filter((item) => item.sku.trim() !== "")
        .map((item) => ({ sku: item.sku, quantity: item.quantity })),
    };
  }

  const hasLineItem = lineItems.some((item) => item.sku.trim() !== "");

  async function calculate() {
    setLoading(true);
    setError(null);

    const payload = buildPayload();

    try {
      const response = await fetch(`${API_BASE_URL}/api/quotes/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await readErrorMessage(
          response,
          "Unable to calculate quote.",
        );
        setError(message);
        setResult(null);
        return;
      }

      const data: CalculatedQuote = await response.json();
      setResult(data);
    } catch {
      setError("Something went wrong while calculating the quote.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  async function saveQuote() {
    setSaving(true);
    setSaveError(null);
    setSavedQuote(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      if (!response.ok) {
        const message = await readErrorMessage(
          response,
          "Unable to save quote.",
        );
        setSaveError(message);
        return;
      }

      const data: SavedQuote = await response.json();
      setSavedQuote(data);
    } catch {
      setSaveError("Something went wrong while saving the quote.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="page">
      <h1>Build a Quote</h1>
      <p className="muted" style={{ marginBottom: "1.5rem" }}>
        Enter deal details to preview pricing and approval requirements.
      </p>

      <div className="grid-2">
        {/* Quote builder form */}
        <section className="card">
          <h2>Deal details</h2>

          <div className="field">
            <label htmlFor="customerName">Customer name</label>
            <input
              id="customerName"
              className="input"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="seatCount">Seat count</label>
            <input
              id="seatCount"
              className="input"
              type="number"
              min={1}
              value={seatCount}
              onChange={(e) => setSeatCount(Number(e.target.value))}
            />
          </div>

          <div className="field">
            <label htmlFor="discountPct">Discount percentage</label>
            <input
              id="discountPct"
              className="input"
              type="number"
              min={0}
              value={discountPct}
              onChange={(e) => setDiscountPct(Number(e.target.value))}
            />
          </div>

          <div className="field">
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={annualCommitment}
                onChange={(e) => setAnnualCommitment(e.target.checked)}
              />
              Annual commitment
            </label>
          </div>

          <h3>Line items</h3>
          {lineItems.map((item, index) => (
            <LineItemRow
              key={index}
              index={index}
              item={item}
              products={products}
              onChange={updateLineItem}
              onRemove={removeLineItem}
              canRemove={lineItems.length > 1}
            />
          ))}
          <button className="btn" type="button" onClick={addLineItem}>
            Add line item
          </button>

          <div className="btn-row">
            <button
              className="btn btn-primary"
              type="button"
              onClick={calculate}
              disabled={loading}
            >
              {loading ? "Calculating..." : "Calculate"}
            </button>
            <button
              className="btn"
              type="button"
              onClick={saveQuote}
              disabled={saving || !hasLineItem}
            >
              {saving ? "Saving..." : "Save Quote"}
            </button>
          </div>

          {saveError && <p className="msg-error">{saveError}</p>}

          {savedQuote && (
            <div className="notice" style={{ marginTop: "1rem" }}>
              <p className="msg-success" style={{ fontWeight: 600 }}>
                Quote saved.
              </p>
              <p>Quote id: {savedQuote.id}</p>
              <p>
                Status:{" "}
                <span className="badge">{formatStatus(savedQuote.status)}</span>
              </p>
              <p>Total: {formatMoney(savedQuote.total, savedQuote.currency)}</p>
              <p className="muted">
                Created {formatDateTime(savedQuote.created_at)} · Updated{" "}
                {formatDateTime(savedQuote.updated_at)}
              </p>
            </div>
          )}
        </section>

        {/* Quote preview panel */}
        <aside className="card">
          <h2>Quote preview</h2>

          {loading && <p>Calculating...</p>}
          {error && <p className="msg-error">{error}</p>}

          {!loading && !error && !result && (
            <p className="muted">
              Pricing preview will appear here once you calculate.
            </p>
          )}

          {!loading && result && (
            <div>
              <ul className="clean-list stack">
                <li className="row-between">
                  <span className="muted">Customer</span>
                  <span>{result.customer_name}</span>
                </li>
                <li className="row-between">
                  <span className="muted">Seat count</span>
                  <span>{result.seat_count}</span>
                </li>
                <li className="row-between">
                  <span className="muted">Tier</span>
                  <span>{result.tier}</span>
                </li>
                <li className="row-between">
                  <span className="muted">Discount</span>
                  <span>{result.discount_pct}%</span>
                </li>
                <li className="row-between">
                  <span className="muted">Subtotal</span>
                  <span>{formatMoney(result.subtotal, result.currency)}</span>
                </li>
                <li className="row-between">
                  <span className="muted">Discount amount</span>
                  <span>
                    {formatMoney(result.discount_amount, result.currency)}
                  </span>
                </li>
                <li className="row-between total-line">
                  <span>Total</span>
                  <span>{formatMoney(result.total, result.currency)}</span>
                </li>
                <li className="row-between">
                  <span className="muted">Approval required</span>
                  <span
                    className={`badge ${
                      result.approval_required
                        ? "badge-danger"
                        : "badge-success"
                    }`}
                  >
                    {result.approval_required ? "Yes" : "No"}
                  </span>
                </li>
              </ul>

              {result.approval_reasons.length > 0 && (
                <div style={{ marginTop: "0.75rem" }}>
                  <p className="muted">Approval reasons</p>
                  <ul className="item-list">
                    {result.approval_reasons.map((reason) => (
                      <li key={reason}>{formatApprovalReason(reason)}</li>
                    ))}
                  </ul>
                </div>
              )}

              <h3 style={{ marginTop: "1rem" }}>Line items</h3>
              <ul className="clean-list item-list">
                {result.line_items.map((line) => (
                  <li key={line.sku} className="row-between">
                    <span>
                      {line.name}{" "}
                      <span className="muted">
                        ({line.sku}) × {line.quantity}
                      </span>
                    </span>
                    <span>{formatMoney(line.line_total, result.currency)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
