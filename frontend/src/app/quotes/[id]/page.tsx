"use client";

import { use, useEffect, useState } from "react";
import { SavedQuote } from "@/types/quote";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function SavedQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
    const {id} = use(params);
  const [quote, setQuote] = useState<SavedQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
