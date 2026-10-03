"use client";

import { useState } from "react";
import LineItemRow, { LineItem } from "@/components/LineItemRow";
import { CalculatedQuote } from "@/types/quote";

const emptyLineItem: LineItem = { sku: "", quantity: 1 };

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function QuoteBuilderPage() {
  const [customerName, setCustomerName] = useState("");
  const [seatCount, setSeatCount] = useState(1);
  const [discountPct, setDiscountPct] = useState(0);
  const [annualCommitment, setAnnualCommitment] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { ...emptyLineItem },
  ]);

  const [result, setResult] = useState<CalculatedQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateLineItem(index: number, item: LineItem) {
    setLineItems((items) => items.map((it, i) => (i === index ? item : it)));
  }

  function addLineItem() {
    setLineItems((items) => [...items, { ...emptyLineItem }]);
  }

  function removeLineItem(index: number) {
    setLineItems((items) => items.filter((_, i) => i !== index));
  }

  async function calculate() {
    setLoading(true);
    setError(null);

    const payload = {
      customer_name: customerName,
      seat_count: seatCount,
      discount_pct: discountPct,
      annual_commitment: annualCommitment,
      line_items: lineItems
        .filter((item) => item.sku.trim() !== "")
        .map((item) => ({ sku: item.sku, quantity: item.quantity })),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/quotes/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Unable to calculate quote.");
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

  return (
    <main style={{ padding: "2rem", display: "flex", gap: "2rem" }}>
      {/* Quote builder form */}
      <section style={{ flex: 1 }}>
        <h1>Build a Quote</h1>

        <div style={{ marginBottom: "0.75rem" }}>
          <label>
            Customer name
            <br />
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </label>
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label>
            Seat count
            <br />
            <input
              type="number"
              min={1}
              value={seatCount}
              onChange={(e) => setSeatCount(Number(e.target.value))}
            />
          </label>
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label>
            Discount percentage
            <br />
            <input
              type="number"
              min={0}
              value={discountPct}
              onChange={(e) => setDiscountPct(Number(e.target.value))}
            />
          </label>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>
            <input
              type="checkbox"
              checked={annualCommitment}
              onChange={(e) => setAnnualCommitment(e.target.checked)}
            />{" "}
            Annual commitment
          </label>
        </div>

        <h2>Line items</h2>
        {lineItems.map((item, index) => (
          <LineItemRow
            key={index}
            index={index}
            item={item}
            onChange={updateLineItem}
            onRemove={removeLineItem}
            canRemove={lineItems.length > 1}
          />
        ))}
        <button type="button" onClick={addLineItem}>
          Add line item
        </button>

        <div style={{ marginTop: "1.5rem" }}>
          <button type="button" onClick={calculate} disabled={loading}>
            {loading ? "Calculating..." : "Calculate"}
          </button>
        </div>
      </section>

      {/* Quote preview panel */}
      <aside
        style={{
          flex: 1,
          borderLeft: "1px solid #ddd",
          paddingLeft: "2rem",
        }}
      >
        <h2>Quote preview</h2>
        {loading && <p>Calculating...</p>}
        {error && <p style={{ color: "crimson" }}>{error}</p>}

        {!loading && !error && !result && (
          <p>Pricing preview will appear here once you calculate.</p>
        )}

        {!loading && result && (
          <div>
            <p>Customer name: {result.customer_name}</p>
            <p>Seat count: {result.seat_count}</p>
            <p>Tier: {result.tier}</p>
            <p>Currency: {result.currency}</p>
            <p>Discount percentage: {result.discount_pct}%</p>
            <p>Subtotal: {result.subtotal}</p>
            <p>Discount amount: {result.discount_amount}</p>
            <p>Total: {result.total}</p>
            <p>Approval required: {result.approval_required ? "Yes" : "No"}</p>

            {result.approval_reasons.length > 0 && (
              <div>
                <p>Approval reasons:</p>
                <ul>
                  {result.approval_reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}

            <h3>Line items</h3>
            <ul>
              {result.line_items.map((line) => (
                <li key={line.sku}>
                  {line.name} ({line.sku}) — qty {line.quantity} ×{" "}
                  {line.unit_price} = {line.line_total}
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </main>
  );
}
