import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function csvCell(value: unknown): string {
  let text = value == null ? "" : value instanceof Date ? value.toISOString() : String(value);
  // Prevent spreadsheet formula execution when a CSV is opened in Excel/Sheets.
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  const user = await getCurrentUser();
  const headers = { "Cache-Control": "no-store, max-age=0", "X-Content-Type-Options": "nosniff" };
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  if (!["OWNER", "ADMIN"].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers });

  const [orders, invoices] = await Promise.all([
    prisma.order.findMany({
      where: { status: { in: ["PAID", "FULFILLED", "REFUNDED"] } },
      orderBy: { updatedAt: "desc" },
      take: 10000,
      select: { id: true, status: true, totalCents: true, refundedCents: true, currency: true, updatedAt: true, user: { select: { name: true, email: true } } },
    }),
    prisma.invoice.findMany({
      where: { status: { in: ["PAID", "SENT", "OVERDUE", "VOID"] } },
      orderBy: { createdAt: "desc" },
      take: 10000,
      select: { id: true, invoiceNumber: true, status: true, totalCents: true, currency: true, createdAt: true, dueAt: true, paidAt: true, user: { select: { name: true, email: true } } },
    }),
  ]);

  const rows: unknown[][] = [[
    "record_type", "record_id", "reference", "status", "customer_name", "customer_email",
    "amount_cents", "refunded_cents", "net_amount_cents", "currency", "record_date", "due_date", "paid_date", "date_semantics",
  ]];
  for (const order of orders) rows.push([
    "ORDER", order.id, "", order.status, order.user.name, order.user.email,
    order.totalCents, order.refundedCents, Math.max(0, order.totalCents - order.refundedCents),
    order.currency, order.updatedAt, "", "",
    "updatedAt is last record update, not a verified payment settlement timestamp; refunds are reconciled from Stripe charge.refunded events",
  ]);
  for (const invoice of invoices) rows.push([
    "INVOICE", invoice.id, invoice.invoiceNumber, invoice.status, invoice.user.name, invoice.user.email,
    invoice.totalCents, "", "", invoice.currency, invoice.createdAt, invoice.dueAt, invoice.paidAt,
    "createdAt is invoice creation; paidAt is recorded invoice payment date",
  ]);

  const body = rows.map(row => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
  return new NextResponse(body, {
    status: 200,
    headers: {
      ...headers,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="n3xus-konc3ptz-finance-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
