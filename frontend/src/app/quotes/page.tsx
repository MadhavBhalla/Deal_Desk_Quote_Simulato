"use client";

import { useEffect, useState } from "react";
import { SavedQuoteSummary } from "@/types/quote";
import { formatDateTime, formatMoney, formatStatus } from "@/lib/format";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function SavedQuotesPage() {
  const [quotes, setQuotes] = useState<SavedQuoteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuotes() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/quotes`);
        if (!response.ok) {
          throw new Error("Unable to load saved quotes.");
        }
        const data: SavedQuoteSummary[] = await response.json();
        setQuotes(data);
      } catch {
        setError("Something went wrong while loading saved quotes.");
      } finally {
        setLoading(false);
      }
    }

    loadQuotes();
  }, []);

  return (
    <main className="page page-narrow">
      <h1>Saved Quotes</h1>
      <p className="muted" style={{ marginBottom: "1.5rem" }}>
        Review previously saved quotes.
      </p>

      {loading && <p>Loading...</p>}
      {error && <p className="msg-error">{error}</p>}

      {!loading && !error && quotes.length === 0 && (
        <p className="muted">No saved quotes yet.</p>
      )}

      {!loading && !error && quotes.length > 0 && (
        <ul className="clean-list">
          {quotes.map((quote) => (
            <li key={quote.id} className="card">
              <div className="card-header">
                <strong>{quote.customer_name}</strong>
                <span className="badge">{formatStatus(quote.status)}</span>
              </div>
              <p className="total-line">
                {formatMoney(quote.total, quote.currency)}
              </p>
              <p className="muted">
                Created {formatDateTime(quote.created_at)} · Updated{" "}
                {formatDateTime(quote.updated_at)}
              </p>
              <p style={{ marginTop: "0.5rem" }}>
                <a href={`/quotes/${quote.id}`}>View details →</a>
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
