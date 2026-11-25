"use client";

import { useState } from "react";
import Link from "next/link";

// One-click Inquiry → Lead conversion on the admin inquiries page. The API
// dedupes against the same rule the CRM workflow uses, so converting an
// inquiry that already became a lead just reports that.
export function ConvertInquiryButton({ inquiryId, alreadyLead }: { inquiryId: string; alreadyLead: boolean }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(alreadyLead);
  const [error, setError] = useState("");

  if (done) {
    return (
      <Link href="/admin/crm" className="text-xs text-emerald-300 underline">
        In the pipeline ✓ — open CRM
      </Link>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={busy}
        className="btn-secondary px-3 py-1.5 text-xs"
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const response = await fetch("/api/admin/conversions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "inquiry-to-lead", inquiryId }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.error || "Conversion failed.");
            setDone(true);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Conversion failed.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Converting…" : "Convert to lead →"}
      </button>
      {error && <span className="text-xs text-rose-300">{error}</span>}
    </span>
  );
}
