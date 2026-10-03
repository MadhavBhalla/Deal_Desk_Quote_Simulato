"use client";

import { useEffect, useState } from "react";
import { SavedQuoteSummary } from "@/types/quote";

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
    <main style={{ padding: "2rem" }}>
      <h1>Saved Quotes</h1>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {!loading && !error && quotes.length === 0 && (
        <p>No saved quotes yet.</p>
      )}

      {!loading && !error && quotes.length > 0 && (
        <ul>
          {quotes.map((quote) => (
            <li key={quote.id} style={{ marginBottom: "1rem" }}>
              <p>Quote id: {quote.id}</p>
              <p>Customer name: {quote.customer_name}</p>
              <p>Status: {quote.status}</p>
              <p>
                Total: {quote.total} {quote.currency}
              </p>
              <p>Created at: {quote.created_at}</p>
              <p>Updated at: {quote.updated_at}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}