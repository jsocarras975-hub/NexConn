import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Data export (M11): the signed-in user can download everything the studio
// holds about them — profile, orders, invoices, tickets, projects, and
// messages — as one JSON file.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [orders, invoices, tickets, projects] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { items: { select: { productId: true, quantity: true, unitPriceCents: true } } },
    }),
    prisma.invoice.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { items: { select: { description: true, quantity: true, unitPriceCents: true } } },
    }),
    prisma.ticket.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { messages: { select: { body: true, createdAt: true } } },
    }),
    prisma.project.findMany({
      where: { clientId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        messages: { select: { body: true, createdAt: true } },
        tasks: { select: { title: true, status: true, dueAt: true } },
      },
    }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    account: { name: user.name, email: user.email, role: user.role },
    orders: orders.map((o) => ({
      id: o.id, status: o.status, subtotalCents: o.subtotalCents, totalCents: o.totalCents,
      refundedCents: o.refundedCents, currency: o.currency, paidAt: o.paidAt, createdAt: o.createdAt, items: o.items,
    })),
    invoices: invoices.map((i) => ({
      id: i.id, invoiceNumber: i.invoiceNumber, status: i.status, subtotalCents: i.subtotalCents,
      taxCents: i.taxCents, totalCents: i.totalCents, refundedCents: i.refundedCents, currency: i.currency,
      dueAt: i.dueAt, paidAt: i.paidAt, createdAt: i.createdAt, items: i.items,
    })),
    tickets: tickets.map((t) => ({ id: t.id, subject: t.subject, status: t.status, createdAt: t.createdAt, messages: t.messages })),
    projects: projects.map((p) => ({ id: p.id, title: p.title, status: p.status, progress: p.progress, createdAt: p.createdAt, messages: p.messages, tasks: p.tasks })),
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="n3xus-konc3ptz-data-${user.id}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
