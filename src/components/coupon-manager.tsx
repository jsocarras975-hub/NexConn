"use client";

import { useState } from "react";
import { money } from "@/lib/format";

type CouponRow = {
  id: string;
  code: string;
  percentOff: number | null;
  amountOffCents: number | null;
  currency: string;
  active: boolean;
  expiresAt: string | null;
  maxRedemptions: number | null;
  timesRedeemed: number;
};

function describe(coupon: CouponRow): string {
  if (coupon.percentOff != null) return `${coupon.percentOff}% off`;
  if (coupon.amountOffCents != null) return `${money(coupon.amountOffCents, coupon.currency)} off`;
  return "—";
}

export function CouponManager({ initialCoupons }: { initialCoupons: CouponRow[] }) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<"percent" | "amount">("percent");
  const [percentOff, setPercentOff] = useState("10");
  const [amountOff, setAmountOff] = useState("5.00");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function create() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const body: Record<string, unknown> = { code: code.trim() };
      if (kind === "percent") body.percentOff = Number(percentOff);
      else body.amountOffDollars = Number(amountOff);
      if (maxRedemptions) body.maxRedemptions = Number(maxRedemptions);
      if (expiresAt) body.expiresAt = new Date(expiresAt).toISOString();
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not create the coupon.");
      const c = data.coupon;
      setCoupons((current) => [{
        id: c.id, code: c.code, percentOff: c.percentOff, amountOffCents: c.amountOffCents,
        currency: c.currency, active: c.active,
        expiresAt: c.expiresAt ?? null, maxRedemptions: c.maxRedemptions, timesRedeemed: c.timesRedeemed,
      }, ...current]);
      setCode("");
      setNotice(`Coupon ${c.code} created.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the coupon.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(coupon: CouponRow) {
    setError("");
    try {
      const response = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !coupon.active }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not update the coupon.");
      setCoupons((current) => current.map((c) => (c.id === coupon.id ? { ...c, active: !c.active } : c)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the coupon.");
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <section className="card p-6">
        <h2 className="font-semibold">New coupon</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm">Code
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="LAUNCH20" className="input mt-1 w-full" />
          </label>
          <label className="text-sm">Type
            <select value={kind} onChange={(e) => setKind(e.target.value as "percent" | "amount")} className="input mt-1 w-full">
              <option value="percent">Percent off</option>
              <option value="amount">Amount off (USD)</option>
            </select>
          </label>
          {kind === "percent" ? (
            <label className="text-sm">Percent (1–100)
              <input value={percentOff} onChange={(e) => setPercentOff(e.target.value)} inputMode="numeric" className="input mt-1 w-full" />
            </label>
          ) : (
            <label className="text-sm">Amount (USD)
              <input value={amountOff} onChange={(e) => setAmountOff(e.target.value)} inputMode="decimal" className="input mt-1 w-full" />
            </label>
          )}
          <label className="text-sm">Max redemptions (optional)
            <input value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value)} inputMode="numeric" className="input mt-1 w-full" />
          </label>
          <label className="text-sm">Expires (optional)
            <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="input mt-1 w-full" />
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
        {notice && <p className="mt-3 text-sm text-emerald-300">{notice}</p>}
        <button type="button" disabled={busy || !code.trim()} onClick={create} className="btn-primary mt-4 disabled:opacity-50">
          {busy ? "Creating…" : "Create coupon"}
        </button>
      </section>

      <section className="card divide-y divide-white/10 p-5 sm:p-7">
        {coupons.length ? coupons.map((coupon) => (
          <article key={coupon.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
            <div>
              <p className="font-mono font-semibold">{coupon.code}</p>
              <p className="mt-1 text-xs text-slate-500">
                {describe(coupon)} · Redeemed {coupon.timesRedeemed}{coupon.maxRedemptions != null ? ` of ${coupon.maxRedemptions}` : ""}
                {coupon.expiresAt ? ` · Expires ${new Date(coupon.expiresAt).toLocaleDateString()}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs ${coupon.active ? "text-emerald-300" : "text-slate-500"}`}>{coupon.active ? "Active" : "Inactive"}</span>
              <button type="button" className="btn-secondary" onClick={() => toggle(coupon)}>
                {coupon.active ? "Deactivate" : "Activate"}
              </button>
            </div>
          </article>
        )) : <p className="py-6 text-sm text-slate-500">No coupons yet.</p>}
      </section>
    </div>
  );
}
