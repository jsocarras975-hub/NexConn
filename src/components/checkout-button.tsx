"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function CheckoutButton({ productId }: { productId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function checkout() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ productId, quantity: 1 }] })
      });
      const data = await response.json();
      if (response.status === 401) {
        router.push("/login?next=/store");
        return;
      }
      if (!response.ok) throw new Error(data.error || "Checkout could not be started.");
      if (!data.url) throw new Error("Payment provider did not return a checkout URL.");
      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
      setBusy(false);
    }
  }

  return <div>
    <button onClick={checkout} disabled={busy} className="mt-6 w-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
      {busy ? "Preparing secure checkout…" : "Buy now"}
    </button>
    {error && <p role="alert" className="mt-3 text-xs text-rose-300">{error}</p>}
  </div>;
}
