import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store, max-age=0" };

// Stage-based planning weights from the v14 spec. These are explicit planning
// assumptions, not historical conversion probabilities or guaranteed revenue.
const STAGE_WEIGHTS: Record<string, number> = {
  NEW: 0.1,
  CONTACTED: 0.2,
  QUALIFIED: 0.4,
  PROPOSAL: 0.7,
  WON: 1,
  LOST: 0,
};

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  if (!["OWNER", "ADMIN"].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: noStore });

  const now = new Date();
  const firstMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));

  const [orders, invoices, leads, customers] = await Promise.all([
    prisma.order.findMany({
      where: { paidAt: { gte: firstMonth }, status: { in: ["PAID", "FULFILLED", "REFUNDED"] } },
      orderBy: { paidAt: "asc" },
      take: 10000,
      select: { id: true, userId: true, totalCents: true, refundedCents: true, currency: true, paidAt: true, createdAt: true },
    }),
    prisma.invoice.findMany({
      where: { paidAt: { gte: firstMonth }, status: "PAID" },
      orderBy: { paidAt: "asc" },
      take: 10000,
      select: { id: true, userId: true, totalCents: true, currency: true, paidAt: true },
    }),
    prisma.crmLead.findMany({
      take: 5000,
      select: { id: true, name: true, stage: true, estimatedValueCents: true, currency: true },
    }),
    prisma.user.findMany({
      where: { role: "CLIENT" },
      orderBy: { createdAt: "desc" },
      take: 1000,
      select: { id: true, name: true, email: true, createdAt: true },
    }),
  ]);

  // --- Revenue overview: verified paid amounts only, per currency, 12 months ---
  const monthly = new Map<string, { month: string; currency: string; orderNetCents: number; invoicePaidCents: number; paidOrders: number; paidInvoices: number }>();
  const revenueByCurrency = new Map<string, { currency: string; orderNetCents: number; invoicePaidCents: number; paidOrders: number; paidInvoices: number }>();
  const ensureMonthly = (month: string, currency: string) => {
    const key = `${month}:${currency}`;
    if (!monthly.has(key)) monthly.set(key, { month, currency, orderNetCents: 0, invoicePaidCents: 0, paidOrders: 0, paidInvoices: 0 });
    return monthly.get(key)!;
  };
  const ensureRevenue = (currency: string) => {
    const key = currency.toUpperCase();
    if (!revenueByCurrency.has(key)) revenueByCurrency.set(key, { currency: key, orderNetCents: 0, invoicePaidCents: 0, paidOrders: 0, paidInvoices: 0 });
    return revenueByCurrency.get(key)!;
  };
  for (const order of orders) {
    if (!order.paidAt) continue;
    const currency = order.currency.toUpperCase();
    const net = Math.max(0, order.totalCents - order.refundedCents);
    const m = ensureMonthly(monthKey(order.paidAt), currency);
    m.orderNetCents += net;
    m.paidOrders += 1;
    const r = ensureRevenue(currency);
    r.orderNetCents += net;
    r.paidOrders += 1;
  }
  for (const invoice of invoices) {
    if (!invoice.paidAt) continue;
    const currency = invoice.currency.toUpperCase();
    const m = ensureMonthly(monthKey(invoice.paidAt), currency);
    m.invoicePaidCents += invoice.totalCents;
    m.paidInvoices += 1;
    const r = ensureRevenue(currency);
    r.invoicePaidCents += invoice.totalCents;
    r.paidInvoices += 1;
  }

  // --- Pipeline forecast: stage-weighted estimated value, LOST excluded ---
  const forecastByCurrency = new Map<string, { currency: string; weightedCents: number; grossCents: number; leads: number }>();
  const forecastByStage = new Map<string, { stage: string; currency: string; weightedCents: number; grossCents: number; leads: number }>();
  for (const lead of leads) {
    if (lead.stage === "LOST") continue;
    const weight = STAGE_WEIGHTS[lead.stage] ?? 0;
    const gross = lead.estimatedValueCents ?? 0;
    const weighted = Math.round(gross * weight);
    const currency = (lead.currency || "USD").toUpperCase();
    const c = forecastByCurrency.get(currency) || { currency, weightedCents: 0, grossCents: 0, leads: 0 };
    c.weightedCents += weighted;
    c.grossCents += gross;
    c.leads += 1;
    forecastByCurrency.set(currency, c);
    const stageKey = `${lead.stage}:${currency}`;
    const s = forecastByStage.get(stageKey) || { stage: lead.stage, currency, weightedCents: 0, grossCents: 0, leads: 0 };
    s.weightedCents += weighted;
    s.grossCents += gross;
    s.leads += 1;
    forecastByStage.set(stageKey, s);
  }

  // --- Customer 360 lifecycle: most recent paid activity per customer ---
  // Marketplace paidAt is preferred; order creation time is used only as a
  // fallback for lifecycle recency and is never counted as verified revenue.
  const lastActivity = new Map<string, Date>();
  const spendByCustomer = new Map<string, Map<string, number>>();
  const addSpend = (userId: string, currency: string, cents: number) => {
    const key = currency.toUpperCase();
    if (!spendByCustomer.has(userId)) spendByCustomer.set(userId, new Map());
    const m = spendByCustomer.get(userId)!;
    m.set(key, (m.get(key) || 0) + cents);
  };
  for (const order of orders) {
    const at = order.paidAt || order.createdAt;
    const prev = lastActivity.get(order.userId);
    if (!prev || at > prev) lastActivity.set(order.userId, at);
    if (order.paidAt) addSpend(order.userId, order.currency, Math.max(0, order.totalCents - order.refundedCents));
  }
  for (const invoice of invoices) {
    if (!invoice.paidAt) continue;
    const prev = lastActivity.get(invoice.userId);
    if (!prev || invoice.paidAt > prev) lastActivity.set(invoice.userId, invoice.paidAt);
    addSpend(invoice.userId, invoice.currency, invoice.totalCents);
  }
  const segmentCounts = { ACTIVE: 0, AT_RISK: 0, DORMANT: 0, NO_PAID_ACTIVITY: 0 };
  const lifecycle = customers.slice(0, 200).map((customer) => {
    const last = lastActivity.get(customer.id) || null;
    const daysSince = last === null ? null : Math.floor((now.getTime() - last.getTime()) / 86400000);
    const segment = last === null
      ? "NO_PAID_ACTIVITY"
      : daysSince! <= 30 ? "ACTIVE" : daysSince! <= 60 ? "AT_RISK" : "DORMANT";
    segmentCounts[segment] += 1;
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      createdAt: customer.createdAt,
      lastPaidActivityAt: last,
      daysSincePaidActivity: daysSince,
      segment,
      spendByCurrency: [...(spendByCustomer.get(customer.id) || new Map()).entries()].map(([currency, cents]) => ({ currency, cents })),
    };
  });

  return NextResponse.json({
    periodStart: firstMonth.toISOString(),
    periodEnd: now.toISOString(),
    sourceLimit: { orders: 10000, invoices: 10000, leads: 5000, customers: 1000, lifecycleShown: 200 },
    revenueByCurrency: [...revenueByCurrency.values()].sort((a, b) => a.currency.localeCompare(b.currency)),
    monthly: [...monthly.values()].sort((a, b) => a.month.localeCompare(b.month) || a.currency.localeCompare(b.currency)),
    forecastByCurrency: [...forecastByCurrency.values()].sort((a, b) => a.currency.localeCompare(b.currency)),
    forecastByStage: [...forecastByStage.values()].sort((a, b) => b.weightedCents - a.weightedCents),
    forecastWeights: STAGE_WEIGHTS,
    segmentCounts,
    lifecycle,
  }, { headers: noStore });
}
