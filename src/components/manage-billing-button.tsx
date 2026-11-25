"use client";

import { useState } from "react";

// Opens Stripe's hosted billing portal (update card, view subscription
// invoices, cancel) in the current tab.
export function ManageBillingButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <span className="inline-flex flex-col items-start gap-2">
      <button
        type="button"
        disabled={busy}
        className="btn-secondary"
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const response = await fetch("/api/subscriptions/portal", { method: "POST" });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.url) throw new Error(data.error || "Could not open the billing portal.");
            window.location.href = data.url;
          } catch (e) {
            setError(e instanceof Error ? e.message : "Could not open the billing portal.");
            setBusy(false);
          }
        }}
      >
        {busy ? "Opening…" : "Manage billing"}
      </button>
      {error && <span className="text-xs text-rose-300">{error}</span>}
    </span>
  );
}
