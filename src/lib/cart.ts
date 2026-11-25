export type CartItem = { productId: string; slug: string; name: string; priceCents: number; currency: string; quantity: number };
export const CART_KEY = "nexcon_cart_v1";

// Two carts hold the same products in the same quantities, regardless of
// order. Used by /api/checkout to reuse a recent PENDING order for the same
// cart instead of creating a duplicate on a double-click or retry.
export function sameCartItems(
  a: { productId: string; quantity: number }[],
  b: { productId: string; quantity: number }[],
): boolean {
  if (a.length !== b.length) return false;
  const byId = new Map(a.map((i) => [i.productId, i.quantity]));
  return b.every((i) => byId.get(i.productId) === i.quantity);
}
