"use client";

import { useCallback, useEffect, useState } from "react";

type Order = {
  id: string;
  status: string;
  subtotalCents: number;
  totalCents: number;
  currency: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
  items: { id: string; quantity: number; unitPriceCents: number; product: { id: string; name: string; slug: string } }[];
};

function amount(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/orders", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load orders.");
    setOrders(data.orders);
  }, []);

  useEffect(() => {
    void load().catch((e) => setError(e instanceof Error ? e.message : "Could not load orders."));
  }, [load]);

  async function act(order: Order, action: "fulfill" | "refund") {
    const prompt = action === "refund"
      ? `Issue a full Stripe refund for ${order.id.slice(-8)} (${amount(order.totalCents, order.currency)})? This cannot be undone here.`
      : `Mark order ${order.id.slice(-8)} as fulfilled?`;
    if (!window.confirm(prompt)) return;

    setBusy(`${order.id}:${action}`);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/${action}`, { method: "POST" });
      const data = await response.json();
      if (!response.ok && response.status !== 202) throw new Error(data.error || "Action failed.");
      setNotice(data.message || (action === "refund" ? "Refund submitted to Stripe." : "Order marked fulfilled."));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="space-y-4">
      {error && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-4 text-sm text-rose-300">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm text-emerald-300">{notice}</p>}
      {orders.map((order) => (
        <article key={order.id} className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-semibold">Order {order.id.slice(-8).toUpperCase()}</p>
              <p className="mt-1 text-xs text-slate-400">{order.user.name} · {order.user.email}</p>
              <p className="mt-1 text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{amount(order.totalCents, order.currency)}</p>
              <p className="mt-1 text-xs text-cyan-300">{order.status}</p>
            </div>
          </div>
          <ul className="mt-4 space-y-1 border-t border-white/10 pt-3 text-sm text-slate-300">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span>{item.product.name} × {item.quantity}</span>
                <span className="text-slate-400">{amount(item.unitPriceCents * item.quantity, order.currency)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {order.status === "PAID" && (
              <button className="btn-secondary" disabled={busy !== null} onClick={() => void act(order, "fulfill")}>
                {busy === `${order.id}:fulfill` ? "Updating…" : "Mark fulfilled"}
              </button>
            )}
            {(order.status === "PAID" || order.status === "FULFILLED") && (
              <button className="btn-secondary border-rose-400/20 text-rose-300" disabled={busy !== null} onClick={() => void act(order, "refund")}>
                {busy === `${order.id}:refund` ? "Submitting…" : "Issue full refund"}
              </button>
            )}
          </div>
        </article>
      ))}
      {!orders.length && !error && <div className="card p-8 text-sm text-slate-500">No orders found.</div>}
      <p className="text-xs leading-6 text-slate-500">Showing the latest 100 orders. Refund actions issue a full Stripe refund only. Confirm refund state in Stripe before manually resolving any unusual payment case.</p>
    </section>
  );
}
