import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store, max-age=0" };

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  if (!["OWNER", "ADMIN"].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: noStore });

  const now = new Date();
  const firstMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
  const [orders, items] = await Promise.all([
    prisma.order.findMany({
      where: { paidAt: { gte: firstMonth }, status: { in: ["PAID", "FULFILLED", "REFUNDED"] } },
      orderBy: { paidAt: "asc" },
      take: 10000,
      select: {
        id: true, userId: true, totalCents: true, refundedCents: true,
        currency: true, paidAt: true, user: { select: { name: true, email: true } },
      },
    }),
    prisma.orderItem.findMany({
      where: { order: { paidAt: { gte: firstMonth }, status: { in: ["PAID", "FULFILLED", "REFUNDED"] } } },
      take: 20000,
      select: {
        quantity: true, unitPriceCents: true,
        product: { select: { id: true, name: true, category: true } },
        order: { select: { currency: true } },
      },
    }),
  ]);

  const monthly = new Map<string, { currency: string; month: string; grossCents: number; refundedCents: number; netCents: number; orders: number }>();
  const customerTotals = new Map<string, { userId: string; name: string; email: string; currency: string; grossCents: number; refundedCents: number; orders: number }>();
  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(firstMonth.getUTCFullYear(), firstMonth.getUTCMonth() + i, 1));
    const month = monthKey(d);
    for (const currency of [...new Set(orders.map(o => o.currency.toUpperCase()))]) {
      monthly.set(`${month}:${currency}`, { month, currency, grossCents: 0, refundedCents: 0, netCents: 0, orders: 0 });
    }
  }
  for (const order of orders) {
    if (!order.paidAt) continue;
    const currency = order.currency.toUpperCase();
    const month = monthKey(order.paidAt);
    const key = `${month}:${currency}`;
    const bucket = monthly.get(key) || { month, currency, grossCents: 0, refundedCents: 0, netCents: 0, orders: 0 };
    bucket.grossCents += order.totalCents;
    bucket.refundedCents += order.refundedCents;
    bucket.netCents += Math.max(0, order.totalCents - order.refundedCents);
    bucket.orders += 1;
    monthly.set(key, bucket);

    const customerKey = `${order.userId}:${currency}`;
    const customer = customerTotals.get(customerKey) || {
      userId: order.userId, name: order.user.name, email: order.user.email,
      currency, grossCents: 0, refundedCents: 0, orders: 0,
    };
    customer.grossCents += order.totalCents;
    customer.refundedCents += order.refundedCents;
    customer.orders += 1;
    customerTotals.set(customerKey, customer);
  }

  const productTotals = new Map<string, { productId: string; name: string; category: string; currency: string; units: number; grossCents: number }>();
  for (const item of items) {
    const currency = item.order.currency.toUpperCase();
    const key = `${item.product.id}:${currency}`;
    const row = productTotals.get(key) || {
      productId: item.product.id, name: item.product.name,
      category: item.product.category, currency, units: 0, grossCents: 0,
    };
    row.units += item.quantity;
    row.grossCents += item.quantity * item.unitPriceCents;
    productTotals.set(key, row);
  }

  return NextResponse.json({
    periodStart: firstMonth.toISOString(),
    periodEnd: now.toISOString(),
    sourceLimit: { orders: 10000, orderItems: 20000 },
    monthly: [...monthly.values()].sort((a, b) => a.month.localeCompare(b.month) || a.currency.localeCompare(b.currency)),
    topProducts: [...productTotals.values()].sort((a, b) => b.grossCents - a.grossCents).slice(0, 10),
    topCustomers: [...customerTotals.values()]
      .map(row => ({ ...row, netCents: Math.max(0, row.grossCents - row.refundedCents) }))
      .sort((a, b) => b.netCents - a.netCents).slice(0, 10),
    totals: {
      paidOrders: orders.length,
      grossCentsByCurrency: [...orders.reduce((map, order) => map.set(order.currency.toUpperCase(), (map.get(order.currency.toUpperCase()) || 0) + order.totalCents), new Map<string, number>()).entries()].map(([currency, cents]) => ({ currency, cents })),
      refundedCentsByCurrency: [...orders.reduce((map, order) => map.set(order.currency.toUpperCase(), (map.get(order.currency.toUpperCase()) || 0) + order.refundedCents), new Map<string, number>()).entries()].map(([currency, cents]) => ({ currency, cents })),
    },
  }, { headers: noStore });
}
