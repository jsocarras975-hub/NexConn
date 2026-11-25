"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Accept-quote action on a quote (DRAFT project invoice) in the portal.
// Two-step: the first click explains what happens, the second confirms.
export function AcceptQuoteButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [stage, setStage] = useState<"idle" | "confirm" | "busy" | "done">("idle");
  const [deposit, setDeposit] = useState<{ id: string; number: string } | null>(null);
  const [error, setError] = useState("");

  if (stage === "done" && deposit) {
    return (
      <div className="no-print rounded-xl border border-emerald-300/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">
        Quote accepted. Your 50% deposit invoice{" "}
        <Link href={`/portal/invoices/${deposit.id}`} className="font-semibold text-emerald-100 underline">{deposit.number}</Link>{" "}
        has been created — once the studio sends it, you can pay it right from your account.
      </div>
    );
  }

  return (
    <div className="no-print rounded-xl border border-cyan-300/30 bg-cyan-400/10 p-4">
      <p className="text-sm text-slate-200">
        This is a quote. Accepting it starts the project and creates a 50% deposit invoice; the rest is billed as milestones.
      </p>
      {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
      {stage === "confirm" || stage === "busy" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={stage === "busy"}
            className="btn-primary"
            onClick={async () => {
              setStage("busy");
              setError("");
              try {
                const response = await fetch(`/api/invoices/${invoiceId}/accept`, { method: "POST" });
                const data = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(data.error || "Could not accept this quote.");
                setDeposit({ id: data.depositInvoiceId, number: data.depositInvoiceNumber });
                setStage("done");
                router.refresh();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Could not accept this quote.");
                setStage("confirm");
              }
            }}
          >
            {stage === "busy" ? "Accepting…" : "Yes, accept this quote"}
          </button>
          <button type="button" className="btn-secondary" disabled={stage === "busy"} onClick={() => setStage("idle")}>Not yet</button>
        </div>
      ) : (
        <button type="button" className="btn-primary mt-3" onClick={() => setStage("confirm")}>Accept this quote</button>
      )}
    </div>
  );
}
