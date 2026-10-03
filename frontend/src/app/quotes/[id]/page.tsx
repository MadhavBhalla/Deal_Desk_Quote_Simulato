"use client";

import { use, useEffect, useState } from "react";
import { SavedQuote } from "@/types/quote";
import {
  formatApprovalReason,
  formatDateTime,
  formatMoney,
  formatStatus,
} from "@/lib/format";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

// Allowed next statuses for each current status (mirrors the backend rules).
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ["submitted"],
  submitted: ["approved", "rejected"],
  approved: [],
  rejected: [],
};
export default function SavedQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [quote, setQuote] = useState<SavedQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [updating, setUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuote() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/quotes/${id}`);
        if (!response.ok) {
          throw new Error("Unable to load quote.");
        }
        const data: SavedQuote = await response.json();
        setQuote(data);
      } catch {
        setError("Something went wrong while loading the quote.");
      } finally {
        setLoading(false);
      }
    }

    loadQuote();
  }, [id]);

  async function updateStatus(nextStatus: string) {
    setUpdating(true);
    setStatusMessage(null);
    setStatusError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/quotes/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) {
        throw new Error("Unable to update status.");
      }
      const data: SavedQuote = await response.json();
      setQuote(data);
      setStatusMessage(`Status updated to ${data.status}.`);
    } catch {
      setStatusError("Something went wrong while updating the status.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <main className="page page-narrow">
      <p>
        <a href="/quotes">← Back to saved quotes</a>
      </p>

      <h1>Saved Quote</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="msg-error">{error}</p>}

      {!loading && !error && quote && (
        <div>
          <div className="card">
            <div className="card-header">
              <strong>{quote.customer_name}</strong>
              <span className="badge">{formatStatus(quote.status)}</span>
            </div>
            <ul className="clean-list stack">
              <li className="row-between">
                <span className="muted">Quote id</span>
                <span>{quote.id}</span>
              </li>
              <li className="row-between">
                <span className="muted">Seat count</span>
                <span>{quote.seat_count}</span>
              </li>
              <li className="row-between">
                <span className="muted">Tier</span>
                <span>{quote.tier}</span>
              </li>
              <li className="row-between">
                <span className="muted">Currency</span>
                <span>{quote.currency}</span>
              </li>
              <li className="row-between">
                <span className="muted">Discount</span>
                <span>{quote.discount_pct}%</span>
              </li>
              <li className="row-between">
                <span className="muted">Annual commitment</span>
                <span>{quote.annual_commitment ? "Yes" : "No"}</span>
              </li>
              <li className="row-between">
                <span className="muted">Subtotal</span>
                <span>{formatMoney(quote.subtotal, quote.currency)}</span>
              </li>
              <li className="row-between">
                <span className="muted">Discount amount</span>
                <span>{formatMoney(quote.discount_amount, quote.currency)}</span>
              </li>
              <li className="row-between total-line">
                <span>Total</span>
                <span>{formatMoney(quote.total, quote.currency)}</span>
              </li>
              <li className="row-between">
                <span className="muted">Approval required</span>
                <span
                  className={`badge ${
                    quote.approval_required ? "badge-danger" : "badge-success"
                  }`}
                >
                  {quote.approval_required ? "Yes" : "No"}
                </span>
              </li>
            </ul>

            {quote.approval_reasons.length > 0 && (
              <div style={{ marginTop: "0.75rem" }}>
                <p className="muted">Approval reasons</p>
                <ul className="item-list">
                  {quote.approval_reasons.map((reason) => (
                    <li key={reason}>{formatApprovalReason(reason)}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="muted" style={{ marginTop: "0.75rem" }}>
              Created {formatDateTime(quote.created_at)} · Updated{" "}
              {formatDateTime(quote.updated_at)}
            </p>
          </div>

          <div className="card">
            <h2>Status actions</h2>
            {ALLOWED_TRANSITIONS[quote.status]?.length ? (
              <div className="btn-row">
                {ALLOWED_TRANSITIONS[quote.status].map((nextStatus) => (
                  <button
                    key={nextStatus}
                    className="btn btn-primary"
                    type="button"
                    onClick={() => updateStatus(nextStatus)}
                    disabled={updating}
                  >
                    {formatStatus(nextStatus)}
                  </button>
                ))}
              </div>
            ) : (
              <p className="muted">No further actions available.</p>
            )}

            {updating && <p>Updating status...</p>}
            {statusMessage && <p className="msg-success">{statusMessage}</p>}
            {statusError && <p className="msg-error">{statusError}</p>}
          </div>

          <div className="card">
            <h2>Line items</h2>
            <ul className="clean-list item-list">
              {quote.line_items.map((line, index) => (
                <li key={`${line.sku}-${index}`} className="row-between">
                  <span>
                    {line.name}{" "}
                    <span className="muted">
                      ({line.sku}) × {line.quantity}
                    </span>
                  </span>
                  <span>{formatMoney(line.line_total, quote.currency)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}
