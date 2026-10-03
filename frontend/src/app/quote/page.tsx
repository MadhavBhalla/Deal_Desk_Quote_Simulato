
"use client";

import { useState } from "react";
import LineItemRow, { LineItem } from "@/components/LineItemRow";

const emptyLineItem: LineItem = { sku: "", quantity: 1 };

export default function QuoteBuilderPage() {
  const [customerName, setCustomerName] = useState("");
  const [seatCount, setSeatCount] = useState(1);
  const [discountPct, setDiscountPct] = useState(0);
  const [annualCommitment, setAnnualCommitment] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([{ ...emptyLineItem }]);

  function updateLineItem(index: number, item: LineItem) {
    setLineItems((items) => items.map((it, i) => (i === index ? item : it)));
  }

  function addLineItem() {
    setLineItems((items) => [...items, { ...emptyLineItem }]);
  }

  function removeLineItem(index: number) {
    setLineItems((items) => items.filter((_, i) => i !== index));
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
      </section>

      {/* Placeholder quote preview panel */}
      <aside
        style={{
          flex: 1,
          borderLeft: "1px solid #ddd",
          paddingLeft: "2rem",
        }}
      >
        <h2>Quote preview</h2>
        <p>Pricing preview will appear here once calculation is connected.</p>
      </aside>
    </main>
  );
}