export type CalculatedLine = {
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type CalculatedQuote = {
  customer_name: string;
  seat_count: number;
  tier: string;
  currency: string;
  discount_pct: number;
  annual_commitment: boolean;
  line_items: CalculatedLine[];
  subtotal: number;
  discount_amount: number;
  total: number;
  approval_required: boolean;
  approval_reasons: string[];
};