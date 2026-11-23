import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store, max-age=0" };

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  if (!["OWNER", "ADMIN"].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: noStore });

  const [orders, invoices, recentInvoices, recentOrders] = await Promise.all([
    prisma.order.findMany({
      where: { status: { in: ["PAID", "FULFILLED", "REFUNDED"] } },
      select: { id: true, status: true, totalCents: true, refundedCents: true, currency: true, updatedAt: true },
      take: 10000,
    }),
    prisma.invoice.findMany({
      where: { status: { in: ["PAID", "SENT", "OVERDUE", "VOID"] } },
      select: { id: true, invoiceNumber: true, status: true, totalCents: true, currency: true, paidAt: true, dueAt: true, createdAt: true, user: { select: { name: true, email: true } } },
      take: 10000,
    }),
    prisma.invoice.findMany({
      orderBy: { createdAt: "desc" }, take: 8,
      select: { id: true, invoiceNumber: true, status: true, totalCents: true, currency: true, createdAt: true, dueAt: true, user: { select: { name: true, email: true } } },
    }),
    prisma.order.findMany({
      orderBy: { updatedAt: "desc" }, take: 8,
      select: { id: true, status: true, totalCents: true, currency: true, updatedAt: true, user: { select: { name: true, email: true } } },
    }),
  ]);

  const byCurrency = new Map<string, { orderGrossCents: number; orderRefundedCents: number; invoicePaidCents: number; invoiceOutstandingCents: number; invoiceOverdueCents: number }>();
  const bucket = (currency: string) => {
    const key = currency.toUpperCase();
    if (!byCurrency.has(key)) byCurrency.set(key, { orderGrossCents: 0, orderRefundedCents: 0, invoicePaidCents: 0, invoiceOutstandingCents: 0, invoiceOverdueCents: 0 });
    return byCurrency.get(key)!;
  };
  for (const order of orders) {
    const b = bucket(order.currency);
    b.orderGrossCents += order.totalCents;
    b.orderRefundedCents += order.refundedCents;
  }
  for (const invoice of invoices) {
    const b = bucket(invoice.currency);
    if (invoice.status === "PAID") b.invoicePaidCents += invoice.totalCents;
    if (invoice.status === "SENT") b.invoiceOutstandingCents += invoice.totalCents;
    if (invoice.status === "OVERDUE") b.invoiceOverdueCents += invoice.totalCents;
  }

  const now = new Date();
  const agingByCurrency = new Map<string, { currentCents: number; days1to30Cents: number; days31to60Cents: number; days61to90Cents: number; days90PlusCents: number }>();
  const agingBucket = (currency: string) => {
    const key = currency.toUpperCase();
    if (!agingByCurrency.has(key)) agingByCurrency.set(key, { currentCents: 0, days1to30Cents: 0, days31to60Cents: 0, days61to90Cents: 0, days90PlusCents: 0 });
    return agingByCurrency.get(key)!;
  };
  for (const invoice of invoices.filter(i => ["SENT", "OVERDUE"].includes(i.status))) {
    const b = agingBucket(invoice.currency);
    const daysLate = invoice.dueAt ? Math.max(0, Math.floor((now.getTime() - invoice.dueAt.getTime()) / 86400000)) : 0;
    if (daysLate === 0) b.currentCents += invoice.totalCents;
    else if (daysLate <= 30) b.days1to30Cents += invoice.totalCents;
    else if (daysLate <= 60) b.days31to60Cents += invoice.totalCents;
    else if (daysLate <= 90) b.days61to90Cents += invoice.totalCents;
    else b.days90PlusCents += invoice.totalCents;
  }
  const overdueInvoices = invoices.filter(i => i.status === "OVERDUE" || (i.status === "SENT" && i.dueAt && i.dueAt < now));
  const openInvoices = invoices.filter(i => ["SENT", "OVERDUE"].includes(i.status));
  const result = {
    currencies: [...byCurrency.entries()].map(([currency, values]) => ({ currency, ...values })),
    invoiceAging: [...agingByCurrency.entries()].map(([currency, values]) => ({ currency, ...values })),
    counts: {
      paidOrders: orders.filter(o => ["PAID", "FULFILLED"].includes(o.status)).length,
      refundedOrders: orders.filter(o => o.status === "REFUNDED").length,
      partiallyRefundedOrders: orders.filter(o => o.refundedCents > 0 && o.refundedCents < o.totalCents).length,
      openInvoices: openInvoices.length,
      overdueInvoices: overdueInvoices.length,
      paidInvoices: invoices.filter(i => i.status === "PAID").length,
    },
    overdue: overdueInvoices.slice(0, 20).map(i => ({
      id: i.id, invoiceNumber: i.invoiceNumber, status: i.status, totalCents: i.totalCents,
      currency: i.currency, dueAt: i.dueAt, customer: i.user.name, email: i.user.email,
    })),
    recentInvoices: recentInvoices.map(i => ({
      id: i.id, invoiceNumber: i.invoiceNumber, status: i.status, totalCents: i.totalCents,
      currency: i.currency, createdAt: i.createdAt, dueAt: i.dueAt, customer: i.user.name,
    })),
    recentOrders: recentOrders.map(o => ({
      id: o.id, status: o.status, totalCents: o.totalCents, currency: o.currency,
      updatedAt: o.updatedAt, customer: o.user.name,
    })),
  };
  return NextResponse.json(result, { headers: noStore });
}
