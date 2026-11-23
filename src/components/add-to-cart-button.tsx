"use client";
import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import type { CartItem } from "@/lib/cart";

export function AddToCartButton({ product }: { product: Omit<CartItem, "quantity"> }) {
  const [added, setAdded] = useState(false);
  function add() {
    try {
      const current: CartItem[] = JSON.parse(localStorage.getItem("nexcon_cart_v1") || "[]");
      const found = current.find(item => item.productId === product.productId);
      if (found) found.quantity = Math.min(10, found.quantity + 1);
      else current.push({ ...product, quantity: 1 });
      localStorage.setItem("nexcon_cart_v1", JSON.stringify(current));
      window.dispatchEvent(new Event("nexcon-cart-updated"));
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1400);
    } catch {
      setAdded(false);
    }
  }
  return <button onClick={add} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-violet-300/30 bg-violet-400/10 px-5 py-3 text-sm font-semibold text-violet-200 hover:bg-violet-400/20">
    {added ? <><Check size={16}/> Added to cart</> : <><ShoppingCart size={16}/> Add to cart</>}
  </button>;
}
