import { NextResponse } from "next/server";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isOverdueInvoice } from "@/lib/invoices";

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
  const auth = await requireAdmin(noStore);
  if ("error" in auth) return auth.error;
  const user = auth.user;

  const now = new Date();
  const firstMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));

  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

  const [orders, invoices, leads, customers, recentOrders, invoiceQueue, invoiceOutstanding, recentInquiries, openTickets, recentLeads, topItems, totalClients, inquiries7d, totalInquiries, openOrdersByStatus, urgentTickets] = await Promise.all([
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
    // --- Owner dashboard queues, KPIs, top products (operational, not revenue-verified) ---
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, status: true, totalCents: true, currency: true, createdAt: true, user: { select: { name: true, email: true } }, _count: { select: { items: true } } },
    }),
    prisma.invoice.findMany({
      where: { status: { in: ["SENT", "OVERDUE"] } },
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      take: 8,
      select: { id: true, invoiceNumber: true, status: true, totalCents: true, currency: true, dueAt: true, createdAt: true, user: { select: { name: true, email: true } } },
    }),
    prisma.invoice.findMany({
      where: { status: { in: ["SENT", "OVERDUE"] } },
      take: 1000,
      select: { totalCents: true, currency: true, status: true, dueAt: true },
    }),
    prisma.inquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, company: true, service: true, createdAt: true },
    }),
    prisma.ticket.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING"] } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, subject: true, status: true, priority: true, createdAt: true, user: { select: { name: true, email: true } } },
    }),
    prisma.crmLead.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, company: true, stage: true, estimatedValueCents: true, currency: true, createdAt: true },
    }),
    prisma.orderItem.findMany({
      where: { order: { paidAt: { gte: firstMonth }, status: { in: ["PAID", "FULFILLED", "REFUNDED"] } } },
      take: 10000,
      select: { orderId: true, productId: true, quantity: true, unitPriceCents: true, order: { select: { currency: true } }, product: { select: { name: true, slug: true } } },
    }),
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.inquiry.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.inquiry.count(),
    prisma.order.groupBy({ by: ["status"], where: { status: { in: ["PENDING", "PAID"] } }, _count: true }),
    prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING"] }, priority: { in: ["HIGH", "URGENT"] } } }),
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
  // Store-order paidAt is preferred; order creation time is used only as a
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
    // Orders from deleted accounts have no userId; they carry no customer.
    if (!order.userId) continue;
    const at = order.paidAt || order.createdAt;
    const prev = lastActivity.get(order.userId);
    if (!prev || at > prev) lastActivity.set(order.userId, at);
    if (order.paidAt) addSpend(order.userId, order.currency, Math.max(0, order.totalCents - order.refundedCents));
  }
  for (const invoice of invoices) {
    if (!invoice.paidAt || !invoice.userId) continue;
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

  // --- Owner dashboard KPIs, queues, top products ---
  // Revenue figures below reuse the verified streams above (orders: Stripe
  // payment date, invoices: recorded payment date) and are shown per stream
  // — the two streams are never summed into one total.
  const primaryCurrency = revenueByCurrency.has("USD") ? "USD" : [...revenueByCurrency.keys()][0] || "USD";
  const currentMonth = monthKey(now);
  const thisMonthRows = [...monthly.values()].filter((r) => r.month === currentMonth && r.currency === primaryCurrency);
  const thisMonthOrdersCents = thisMonthRows.reduce((a, r) => a + r.orderNetCents, 0);
  const thisMonthInvoicesCents = thisMonthRows.reduce((a, r) => a + r.invoicePaidCents, 0);
  const last12Row = revenueByCurrency.get(primaryCurrency) || { orderNetCents: 0, invoicePaidCents: 0 };
  const pipeRow = forecastByCurrency.get(primaryCurrency) || { weightedCents: 0, grossCents: 0, leads: 0 };

  const invTotals = new Map<string, { dueCents: number; dueCount: number; overdueCents: number; overdueCount: number }>();
  for (const inv of invoiceOutstanding) {
    const currency = inv.currency.toUpperCase();
    const t = invTotals.get(currency) || { dueCents: 0, dueCount: 0, overdueCents: 0, overdueCount: 0 };
    if (isOverdueInvoice(inv, now)) { t.overdueCents += inv.totalCents; t.overdueCount += 1; }
    else { t.dueCents += inv.totalCents; t.dueCount += 1; }
    invTotals.set(currency, t);
  }
  const invoicesCurrency = invTotals.has("USD") ? "USD" : [...invTotals.keys()][0] || primaryCurrency;
  const inv = invTotals.get(invoicesCurrency) || { dueCents: 0, dueCount: 0, overdueCents: 0, overdueCount: 0 };

  const openOrderCounts = { PENDING: 0, PAID: 0 };
  for (const g of openOrdersByStatus) {
    if (g.status === "PENDING" || g.status === "PAID") openOrderCounts[g.status] = g._count;
  }

  const productAgg = new Map<string, { productId: string; name: string; slug: string; currency: string; revenueCents: number; units: number; orderIds: Set<string> }>();
  for (const item of topItems) {
    const currency = item.order.currency.toUpperCase();
    const key = `${item.productId}:${currency}`;
    const p = productAgg.get(key) || { productId: item.productId, name: item.product.name, slug: item.product.slug, currency, revenueCents: 0, units: 0, orderIds: new Set<string>() };
    p.revenueCents += item.quantity * item.unitPriceCents;
    p.units += item.quantity;
    p.orderIds.add(item.orderId);
    productAgg.set(key, p);
  }
  const topProducts = [...productAgg.values()]
    .map(({ orderIds, ...rest }) => ({ ...rest, orders: orderIds.size }))
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 5);

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
    kpis: {
      currency: primaryCurrency,
      currentMonth,
      thisMonthOrdersCents,
      thisMonthInvoicesCents,
      last12OrdersCents: last12Row.orderNetCents,
      last12InvoicesCents: last12Row.invoicePaidCents,
      pipelineWeightedCents: pipeRow.weightedCents,
      pipelineGrossCents: pipeRow.grossCents,
      openLeads: pipeRow.leads,
      openOrders: { total: openOrderCounts.PENDING + openOrderCounts.PAID, pending: openOrderCounts.PENDING, paid: openOrderCounts.PAID },
      invoicesDueCents: inv.dueCents,
      invoicesDueCount: inv.dueCount,
      invoicesOverdueCents: inv.overdueCents,
      invoicesOverdueCount: inv.overdueCount,
      invoicesCurrency,
      inquiries7d,
      totalInquiries,
      openTickets: openTickets.length,
      urgentTickets,
      activeCustomers: segmentCounts.ACTIVE,
      totalClients,
    },
    queues: {
      orders: recentOrders.map((o) => ({ id: o.id, status: o.status, totalCents: o.totalCents, currency: o.currency, createdAt: o.createdAt, customerName: o.user?.name ?? "Deleted account", customerEmail: o.user?.email ?? "", items: o._count.items })),
      invoices: invoiceQueue.map((i) => ({ id: i.id, invoiceNumber: i.invoiceNumber, status: i.status, totalCents: i.totalCents, currency: i.currency, dueAt: i.dueAt, createdAt: i.createdAt, customerName: i.user?.name ?? "Deleted account", customerEmail: i.user?.email ?? "" })),
      inquiries: recentInquiries.map((q) => ({ id: q.id, name: q.name, email: q.email, company: q.company, service: q.service, createdAt: q.createdAt })),
      tickets: openTickets.map((t) => ({ id: t.id, subject: t.subject, status: t.status, priority: t.priority, createdAt: t.createdAt, customerName: t.user.name, customerEmail: t.user.email })),
      leads: recentLeads.map((l) => ({ id: l.id, name: l.name, company: l.company, stage: l.stage, estimatedValueCents: l.estimatedValueCents, currency: l.currency, createdAt: l.createdAt })),
    },
    topProducts,
  }, { headers: noStore });
}
