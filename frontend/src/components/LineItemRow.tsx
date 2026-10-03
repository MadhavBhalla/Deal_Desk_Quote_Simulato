"use client";

export type LineItem = {
  sku: string;
  quantity: number;
};

type LineItemRowProps = {
  index: number;
  item: LineItem;
  onChange: (index: number, item: LineItem) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
};

export default function LineItemRow({
  index,
  item,
  onChange,
  onRemove,
  canRemove,
}: LineItemRowProps) {
  return (
    <div className="line-row">
      <input
        className="input"
        type="text"
        placeholder="SKU (e.g. AGENT-CORE)"
        value={item.sku}
        onChange={(e) => onChange(index, { ...item, sku: e.target.value })}
      />
      <input
      className="input input-qty"
        type="number"
        min={1}
        placeholder="Quantity"
        value={item.quantity}
        onChange={(e) =>
          onChange(index, { ...item, quantity: Number(e.target.value) })
        }
      />
      <button
      className="btn"
        type="button"
        onClick={() => onRemove(index)}
        disabled={!canRemove}
      >
        Remove
      </button>
    </div>
  );
}