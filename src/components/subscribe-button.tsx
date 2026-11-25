"use client";

import { useState } from "react";

// Subscribe button for the hosting services. Starts a subscription-mode
// Stripe Checkout; a signed-out visitor is sent to login first and comes
// back to the service page afterwards.
export function SubscribeButton({ plan, serviceSlug }: { plan: string; serviceSlug: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="mt-6">
      <button
        type="button"
        disabled={busy}
        className="btn-primary w-full"
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const response = await fetch("/api/subscriptions/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ plan }),
            });
            if (response.status === 401) {
              window.location.href = `/login?next=/services/${serviceSlug}`;
              return;
            }
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.url) throw new Error(data.error || "Could not start checkout.");
            window.location.href = data.url;
          } catch (e) {
            setError(e instanceof Error ? e.message : "Could not start checkout.");
            setBusy(false);
          }
        }}
      >
        {busy ? "Starting checkout…" : "Subscribe — billed monthly"}
      </button>
      {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
      <p className="mt-3 text-xs text-slate-500">Recurring monthly billing through Stripe. Cancel any time from your account.</p>
    </div>
  );
}
