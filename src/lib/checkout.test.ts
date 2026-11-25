import { describe, expect, it } from "vitest";
import { sameCartItems } from "@/lib/cart";
import { isOverdueInvoice } from "@/lib/invoices";

describe("sameCartItems", () => {
  it("matches the same products in a different order", () => {
    expect(
      sameCartItems(
        [{ productId: "a", quantity: 1 }, { productId: "b", quantity: 2 }],
        [{ productId: "b", quantity: 2 }, { productId: "a", quantity: 1 }],
      ),
    ).toBe(true);
  });
  it("rejects a different quantity", () => {
    expect(
      sameCartItems(
        [{ productId: "a", quantity: 1 }],
        [{ productId: "a", quantity: 2 }],
      ),
    ).toBe(false);
  });
  it("rejects a different product", () => {
    expect(
      sameCartItems(
        [{ productId: "a", quantity: 1 }],
        [{ productId: "c", quantity: 1 }],
      ),
    ).toBe(false);
  });
  it("rejects a different item count", () => {
    expect(
      sameCartItems(
        [{ productId: "a", quantity: 1 }],
        [{ productId: "a", quantity: 1 }, { productId: "b", quantity: 1 }],
      ),
    ).toBe(false);
  });
});

describe("isOverdueInvoice", () => {
  const now = new Date("2026-11-25T12:00:00Z");
  const past = new Date("2026-11-20T12:00:00Z");
  const future = new Date("2026-12-01T12:00:00Z");
  it("a SENT invoice past its due date is overdue", () => {
    expect(isOverdueInvoice({ status: "SENT", dueAt: past }, now)).toBe(true);
  });
  it("a SENT invoice before its due date is not overdue", () => {
    expect(isOverdueInvoice({ status: "SENT", dueAt: future }, now)).toBe(false);
  });
  it("an OVERDUE invoice is overdue even without a due date", () => {
    expect(isOverdueInvoice({ status: "OVERDUE", dueAt: null }, now)).toBe(true);
  });
  it("a DRAFT invoice is not overdue", () => {
    expect(isOverdueInvoice({ status: "DRAFT", dueAt: past }, now)).toBe(false);
  });
  it("a PAID invoice is not overdue", () => {
    expect(isOverdueInvoice({ status: "PAID", dueAt: past }, now)).toBe(false);
  });
});
