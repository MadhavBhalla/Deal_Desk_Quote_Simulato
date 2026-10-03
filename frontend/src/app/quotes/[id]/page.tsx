"use client";

import { use, useEffect, useState } from "react";
import { SavedQuote } from "@/types/quote";

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
    <main style={{ padding: "2rem" }}>
      <p>
        <a href="/quotes">Back to saved quotes</a>
      </p>

      <h1>Saved Quote</h1>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {!loading && !error && quote && (
        <div>
          <p>Quote id: {quote.id}</p>
          <p>Customer name: {quote.customer_name}</p>
          <p>Seat count: {quote.seat_count}</p>
          <p>Tier: {quote.tier}</p>
          <p>Currency: {quote.currency}</p>
          <p>Discount percentage: {quote.discount_pct}%</p>
          <p>Annual commitment: {quote.annual_commitment ? "Yes" : "No"}</p>
          <p>Subtotal: {quote.subtotal}</p>
          <p>Discount amount: {quote.discount_amount}</p>
          <p>Total: {quote.total}</p>
          <p>Approval required: {quote.approval_required ? "Yes" : "No"}</p>

          {quote.approval_reasons.length > 0 && (
            <div>
              <p>Approval reasons:</p>
              <ul>
                {quote.approval_reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          <p>Status: {quote.status}</p>
          <p>Created at: {quote.created_at}</p>
          <p>Updated at: {quote.updated_at}</p>

          <div style={{ marginTop: "1rem" }}>
            <h2>Status actions</h2>
            {ALLOWED_TRANSITIONS[quote.status]?.length ? (
              ALLOWED_TRANSITIONS[quote.status].map((nextStatus) => (
                <button
                  key={nextStatus}
                  type="button"
                  onClick={() => updateStatus(nextStatus)}
                  disabled={updating}
                  style={{ marginRight: "0.5rem" }}
                >
                  {nextStatus}
                </button>
              ))
            ) : (
              <p>No further actions available.</p>
            )}

            {updating && <p>Updating status...</p>}
            {statusMessage && <p style={{ color: "green" }}>{statusMessage}</p>}
            {statusError && <p style={{ color: "crimson" }}>{statusError}</p>}
          </div>
          <h2>Line items</h2>
          <ul>
            {quote.line_items.map((line, index) => (
              <li key={`${line.sku}-${index}`}>
                {line.name} ({line.sku}) — qty {line.quantity} ×{" "}
                {line.unit_price} = {line.line_total}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
