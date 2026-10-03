import { CalculatedQuote } from "@/types/quote";
import { formatApprovalReason, formatMoney } from "@/lib/format";

// Maximum discount per tier, matching the backend catalog discount rules.
const TIER_MAX_DISCOUNT: Record<string, number> = {
  STARTER: 10,
  GROWTH: 20,
  ENTERPRISE: 30,
};

// Build a deterministic, human-readable explanation of a calculated quote.
export function explainQuote(quote: CalculatedQuote): string[] {
  const maxDiscount = TIER_MAX_DISCOUNT[quote.tier];
  const tierLine =
    maxDiscount !== undefined
      ? `${quote.seat_count} seats → ${quote.tier} tier → maximum discount ${maxDiscount}%.`
      : `${quote.seat_count} seats → ${quote.tier} tier.`;

  const pricingLine = `Subtotal ${formatMoney(
    quote.subtotal,
    quote.currency
  )} → ${quote.discount_pct}% discount (${formatMoney(
    quote.discount_amount,
    quote.currency
  )}) → final ${formatMoney(quote.total, quote.currency)}.`;

  const approvalLine = quote.approval_required
    ? `Approval required because: ${quote.approval_reasons
        .map(formatApprovalReason)
        .join("; ")}.`
    : "No approval required.";

  return [tierLine, pricingLine, approvalLine];
}