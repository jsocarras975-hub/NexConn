import { NextResponse, after } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { sendInvoicePaidEmail } from "@/lib/transactional-email";

export const runtime = "nodejs";
const schema = z.object({ status: z.enum(["SENT", "PAID", "VOID"]) });
const noStore = { "Cache-Control": "no-store" };

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] || character);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  if (!["OWNER", "ADMIN"].includes(actor.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: noStore });

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: noStore }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Unsupported invoice status." }, { status: 400, headers: noStore });

  const { id } = await params;
  const existing = await prisma.invoice.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true } }, items: true },
  });
  if (!existing) return NextResponse.json({ error: "Invoice not found." }, { status: 404, headers: noStore });
  if (existing.status === "VOID" || existing.status === "PAID") {
    return NextResponse.json({ error: "Paid or void invoices cannot be changed." }, { status: 409, headers: noStore });
  }
  if (parsed.data.status === "SENT" && existing.status !== "DRAFT") {
    return NextResponse.json({ error: "Only draft invoices can be marked sent." }, { status: 409, headers: noStore });
  }
  if (parsed.data.status === "PAID" && !["SENT", "OVERDUE"].includes(existing.status)) {
    return NextResponse.json({ error: "Only sent or overdue invoices can be marked paid." }, { status: 409, headers: noStore });
  }

  const updated = await prisma.invoice.updateMany({
    where: {
      id,
      // Guarded by status so a concurrent webhook settlement cannot be
      // overwritten: a read-then-update here could flip a just-PAID invoice
      // back to VOID. If the status moved since the read, count is 0.
      status:
        parsed.data.status === "SENT" ? "DRAFT"
        : parsed.data.status === "PAID" ? { in: ["SENT", "OVERDUE"] }
        : { in: ["DRAFT", "SENT", "OVERDUE"] },
    },
    data: {
      status: parsed.data.status,
      ...(parsed.data.status === "PAID" ? { paidAt: new Date() } : {}),
    },
  });
  if (updated.count !== 1) {
    return NextResponse.json({ error: "Invoice status changed. Refresh and try again." }, { status: 409, headers: noStore });
  }

  // A voided or hand-marked-paid invoice must not stay payable: expire the
  // open Checkout session so the customer cannot pay it afterwards, and
  // clear the session id so a later checkout starts fresh.
  if ((parsed.data.status === "VOID" || parsed.data.status === "PAID") && existing.stripeCheckoutSession && process.env.STRIPE_SECRET_KEY) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    await stripe.checkout.sessions.expire(existing.stripeCheckoutSession).catch((error) => {
      console.error("Could not expire invoice checkout session", { invoiceId: id, error });
    });
    await prisma.invoice.updateMany({
      where: { id, stripeCheckoutSession: existing.stripeCheckoutSession },
      data: { stripeCheckoutSession: null },
    });
  }

  const invoice = { id, invoiceNumber: existing.invoiceNumber, status: parsed.data.status, paidAt: parsed.data.status === "PAID" ? new Date() : existing.paidAt };

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: `INVOICE_MARKED_${parsed.data.status}`,
      target: id,
      metadata: { previousStatus: existing.status },
    },
  });

  let emailSent = false;
  // An invoice whose customer deleted their account has no one to email;
  // the status change still stands, it just skips the notification.
  if (parsed.data.status === "SENT" && existing.user) {
    const appUrl = (process.env.APP_URL || "").replace(/\/+$/, "");
    const invoiceUrl = appUrl ? `${appUrl}/portal/invoices/${id}` : "";
    const amount = new Intl.NumberFormat("en-US", {
      style: "currency", currency: existing.currency.toUpperCase(),
    }).format(existing.totalCents / 100);
    const due = existing.dueAt ? new Date(existing.dueAt).toLocaleDateString("en-US") : "Upon receipt";
    const rows = existing.items.map((item) =>
      `<tr><td>${escapeHtml(item.description)}</td><td>${item.quantity}</td><td>${(item.unitPriceCents / 100).toFixed(2)}</td></tr>`
    ).join("");
    const email = await sendEmail({
      to: existing.user.email,
      subject: `N3xUs Konc3pt'z invoice ${existing.invoiceNumber}`,
      html: `<p>Hello ${escapeHtml(existing.user.name)},</p><p>Your invoice <strong>${escapeHtml(existing.invoiceNumber)}</strong> is ready.</p><p><strong>Total: ${escapeHtml(amount)}</strong><br>Due: ${escapeHtml(due)}</p><table><thead><tr><th>Description</th><th>Qty</th><th>Unit price</th></tr></thead><tbody>${rows}</tbody></table>${invoiceUrl ? `<p><a href="${escapeHtml(invoiceUrl)}">View and print invoice</a></p>` : ""}<p>Please contact us if you have questions.</p>`,
    });
    emailSent = email.sent;
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: email.sent ? "INVOICE_EMAIL_SENT" : "INVOICE_EMAIL_NOT_SENT",
        target: id,
        metadata: { reason: email.sent ? null : email.reason || "Email provider unavailable." },
      },
    });
  }

  // A hand-marked-paid invoice gets the same receipt email as a Stripe-paid
  // one, sent after the response.
  if (parsed.data.status === "PAID" && existing.user) {
    after(async () => {
      try {
        await sendInvoicePaidEmail(id);
      } catch (error) {
        console.error("Invoice paid receipt email failed", error);
      }
    });
  }

  return NextResponse.json({ invoice, emailSent }, { headers: noStore });
}
