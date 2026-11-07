import type { Draft, Product, Result } from "./types";

type CostKind = "labor" | "transport";
const costId = (kind: CostKind) => `quote-${kind}-total`;

export function costInputValue(draft: Draft, result: Result | undefined, kind: CostKind): number {
  const row = draft.extras.find(extra => extra.id === costId(kind));
  return row ? row.unit_price : result?.subtotals[kind] || 0;
}

/** Replace the category total with one amount for the entire quotation. */
export function costInputPatch(draft: Draft, product: Product, kind: CostKind, amount: number): Partial<Draft> {
  const overrides = { ...draft.overrides };
  for (const line of product.definition.lines as { id: string; kind: string }[]) {
    if (line.kind === kind) overrides[line.id] = { ...overrides[line.id], selected: false };
  }
  return { overrides, extras: [
    ...draft.extras.filter(extra => extra.id !== costId(kind)).map(extra => extra.kind === kind ? { ...extra, selected: false } : extra),
    { id: costId(kind), code: "", name: kind === "labor" ? "Nhân công" : "Vận chuyển", unit: "gói",
      quantity: 1, unit_price: amount, kind, selected: amount > 0 },
  ] };
}
