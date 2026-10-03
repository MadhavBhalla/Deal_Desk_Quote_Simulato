import type { LineItem } from "@/components/LineItemRow";

// Single storage key for the unsaved quote builder draft.
const DRAFT_STORAGE_KEY = "deal-desk:quote-draft";

// The subset of builder form state we persist across refreshes. The calculated
// preview and saved-quote response are intentionally excluded.
export interface QuoteDraft {
  customerName: string;
  seatCount: number;
  discountPct: number;
  annualCommitment: boolean;
  lineItems: LineItem[];
}

function isLineItem(value: unknown): value is LineItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const item = value as Record<string, unknown>;
  return typeof item.sku === "string" && typeof item.quantity === "number";
}

// Validate a parsed object looks like a draft before trusting it.
function isQuoteDraft(value: unknown): value is QuoteDraft {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const draft = value as Record<string, unknown>;
  return (
    typeof draft.customerName === "string" &&
    typeof draft.seatCount === "number" &&
    typeof draft.discountPct === "number" &&
    typeof draft.annualCommitment === "boolean" &&
    Array.isArray(draft.lineItems) &&
    draft.lineItems.every(isLineItem)
  );
}

// Persist the current draft. No-op on the server or if storage is unavailable.
export function saveDraft(draft: QuoteDraft): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Ignore storage errors (e.g. private mode / quota); drafts are best effort.
  }
}

// Load a previously saved draft, or null if none exists or it is invalid.
export function loadDraft(): QuoteDraft | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    return isQuoteDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// Remove the stored draft (e.g. after a successful save).
export function clearDraft(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
}