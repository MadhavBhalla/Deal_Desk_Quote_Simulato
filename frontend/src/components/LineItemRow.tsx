"use client";
import { Product } from "@/types/quote";
export type LineItem = {
  sku: string;
  quantity: number;
};

type LineItemRowProps = {
  index: number;
  item: LineItem;
  products: Product[];
  onChange: (index: number, item: LineItem) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
};

export default function LineItemRow({
  index,
  item,
  products,
  onChange,
  onRemove,
  canRemove,
}: LineItemRowProps) {
  return (
    <div className="line-row">
      <select
        className="input"
        value={item.sku}
        onChange={(e) => onChange(index, { ...item, sku: e.target.value })}
      >
        <option value="">Select a product…</option>
        {products.map((product) => (
          <option key={product.sku} value={product.sku}>
            {product.name} ({product.sku})
          </option>
        ))}
      </select>
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
