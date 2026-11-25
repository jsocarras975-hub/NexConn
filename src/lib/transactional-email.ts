// Transactional emails: order receipts (with download-ready links), invoice
// payment receipts, refund notices, ticket-reply notices and project update
// notices. Every sender loads its own data, sends with retries, logs failures
// and never throws — a mail outage must never fail a webhook or a request.

import { prisma } from "@/lib/prisma";
import { sendEmailWithRetry } from "@/lib/email";
import { money } from "@/lib/format";

function esc(value: string): string {
  return value.replace(/[&<>"]/g, "");
}

function appUrl(path: string): string | null {
  if (!process.env.APP_URL) return null;
  return new URL(path, process.env.APP_URL).toString();
}

async function deliver(label: string, to: string, subject: string, html: string) {
  const result = await sendEmailWithRetry({ to, subject, html });
  if (!result.sent) console.error(`Transactional email failed (${label})`, result.reason);
  return result;
}

// Receipt for a paid store order. Store products are downloads, so the
// receipt doubles as the "your download is ready" email.
export async function sendOrderReceiptEmail(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { email: true, name: true } },
      items: { include: { product: { select: { name: true } } } },
    },
  });
  if (!order?.user?.email) return;
  const lines = order.items
    .map((item) => `<tr><td>${esc(item.product.name)} × ${item.quantity}</td><td style="text-align:right">${money(item.unitPriceCents * item.quantity, order.currency)}</td></tr>`)
    .join("");
  const libraryUrl = appUrl("/portal/library");
  const ordersUrl = appUrl("/portal/orders");
  const html = [
    `<p>Hi ${esc(order.user.name)},</p>`,
    `<p>Thanks for your order — payment of <strong>${money(order.totalCents, order.currency)}</strong> is confirmed and your downloads are ready.</p>`,
    `<table style="border-collapse:collapse;width:100%">${lines}<tr><td style="border-top:1px solid #ccc;padding-top:6px"><strong>Total</strong></td><td style="border-top:1px solid #ccc;padding-top:6px;text-align:right"><strong>${money(order.totalCents, order.currency)}</strong></td></tr></table>`,
    libraryUrl ? `<p><a href="${libraryUrl}">Download your purchases</a></p>` : "",
    ordersUrl ? `<p>You can also view this order any time in <a href="${ordersUrl}">your account</a>.</p>` : "",
    `<p>— N3xUs Konc3pt'z</p>`,
  ].join("");
  await deliver("order receipt", order.user.email, "Your N3xUs Konc3pt'z receipt — downloads ready", html);
}

// Receipt for a paid invoice.
export async function sendInvoicePaidEmail(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { user: { select: { email: true, name: true } } },
  });
  if (!invoice?.user?.email) return;
  const invoicesUrl = appUrl("/portal/invoices");
  const html = [
    `<p>Hi ${esc(invoice.user.name)},</p>`,
    `<p>Payment received for invoice <strong>${esc(invoice.invoiceNumber)}</strong> — <strong>${money(invoice.totalCents, invoice.currency)}</strong>. Thank you.</p>`,
    invoicesUrl ? `<p>View it in <a href="${invoicesUrl}">your account</a>.</p>` : "",
    `<p>— N3xUs Konc3pt'z</p>`,
  ].join("");
  await deliver("invoice receipt", invoice.user.email, `Payment received — invoice ${invoice.invoiceNumber}`, html);
}

// Refund notice for an order or an invoice. `full` picks the wording.
export async function sendRefundEmail(input: {
  orderId?: string;
  invoiceId?: string;
  refundedCents: number;
  totalCents: number;
  currency: string;
}) {
  let email: string | null = null;
  let name = "";
  let label = "";
  if (input.orderId) {
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      include: { user: { select: { email: true, name: true } } },
    });
    email = order?.user?.email ?? null;
    name = order?.user?.name ?? "";
    label = "your order";
  } else if (input.invoiceId) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: input.invoiceId },
      include: { user: { select: { email: true, name: true } } },
    });
    email = invoice?.user?.email ?? null;
    name = invoice?.user?.name ?? "";
    label = `invoice ${invoice?.invoiceNumber ?? ""}`;
  }
  if (!email) return;
  const full = input.refundedCents >= input.totalCents;
  const html = [
    `<p>Hi ${esc(name)},</p>`,
    `<p>We have refunded <strong>${money(input.refundedCents, input.currency)}</strong> for ${esc(label)}${full ? " — that is the full amount" : ""}. The money goes back to your original payment method; banks usually take 5–10 business days to show it.</p>`,
    `<p>— N3xUs Konc3pt'z</p>`,
  ].join("");
  await deliver("refund notice", email, `Refund processed — ${money(input.refundedCents, input.currency)}`, html);
}

// Ticket reply notice. Staff replies notify the ticket owner; client replies
// notify the studio inbox (OWNER_EMAIL) when one is configured.
export async function sendTicketReplyEmail(ticketId: string, authorIsStaff: boolean) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { user: { select: { email: true, name: true } } },
  });
  if (!ticket) return;
  if (authorIsStaff) {
    const supportUrl = appUrl("/portal/support");
    const html = [
      `<p>Hi ${esc(ticket.user.name)},</p>`,
      `<p>We replied to your support ticket <strong>${esc(ticket.subject)}</strong>.</p>`,
      supportUrl ? `<p><a href="${supportUrl}">Read the reply and respond</a></p>` : "",
      `<p>— N3xUs Konc3pt'z</p>`,
    ].join("");
    await deliver("ticket reply", ticket.user.email, `Re: ${ticket.subject}`, html);
  } else if (process.env.OWNER_EMAIL) {
    const html = `<p>${esc(ticket.user.name)} (${esc(ticket.user.email)}) replied to ticket <strong>${esc(ticket.subject)}</strong>.</p>`;
    await deliver("ticket reply (owner)", process.env.OWNER_EMAIL, `Ticket reply: ${ticket.subject}`, html);
  }
}

// Payment reminder for an overdue invoice, sent by the daily cron at 3, 7
// and 14 days past the due date.
export async function sendInvoiceReminderEmail(invoiceId: string, daysOverdue: number) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { user: { select: { email: true, name: true } } },
  });
  if (!invoice?.user?.email) return;
  const invoiceUrl = appUrl(`/portal/invoices/${invoice.id}`);
  const dueText = invoice.dueAt ? invoice.dueAt.toLocaleDateString("en-US") : "";
  const html = [
    `<p>Hi ${esc(invoice.user.name)},</p>`,
    `<p>A friendly reminder: invoice <strong>${esc(invoice.invoiceNumber)}</strong> for <strong>${money(invoice.totalCents, invoice.currency)}</strong>${dueText ? ` was due on ${dueText}` : ""} and is now ${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue.</p>`,
    invoiceUrl ? `<p><a href="${invoiceUrl}">View and pay the invoice</a></p>` : "",
    `<p>If you have already paid, please ignore this note. Questions? Just reply to this email.</p>`,
    `<p>— N3xUs Konc3pt'z</p>`,
  ].join("");
  await deliver("invoice reminder", invoice.user.email, `Reminder: invoice ${invoice.invoiceNumber} is ${daysOverdue} days overdue`, html);
}

// Subscription welcome, sent when a hosting subscription is created.
export async function sendSubscriptionWelcomeEmail(userId: string, planName: string, priceCents: number, currency: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
  if (!user?.email) return;
  const billingUrl = appUrl("/portal/billing");
  const html = [
    `<p>Hi ${esc(user.name)},</p>`,
    `<p>Your <strong>${esc(planName)}</strong> subscription is active — ${money(priceCents, currency)} per month.</p>`,
    billingUrl ? `<p>Manage your subscription, update your card, or cancel any time from <a href="${billingUrl}">your billing page</a>.</p>` : "",
    `<p>We will get your hosting set up and follow up by email with the details.</p>`,
    `<p>— N3xUs Konc3pt'z</p>`,
  ].join("");
  await deliver("subscription welcome", user.email, `Your ${planName} subscription is active`, html);
}

// Receipt for a subscription payment (the first one and each renewal).
export async function sendSubscriptionReceiptEmail(userId: string, planName: string, amountCents: number, currency: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
  if (!user?.email) return;
  const billingUrl = appUrl("/portal/billing");
  const html = [
    `<p>Hi ${esc(user.name)},</p>`,
    `<p>Payment received for <strong>${esc(planName)}</strong> — <strong>${money(amountCents, currency)}</strong>. Thank you.</p>`,
    billingUrl ? `<p>View your subscription in <a href="${billingUrl}">your account</a>.</p>` : "",
    `<p>— N3xUs Konc3pt'z</p>`,
  ].join("");
  await deliver("subscription receipt", user.email, `Subscription payment received — ${planName}`, html);
}

// "New version available" notice to everyone who bought a product, sent when
// the admin attaches a new version of its file.
export async function sendProductUpdateEmail(productId: string, version: string, changelog: string | null) {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { name: true } });
  if (!product) return;
  const buyers = await prisma.user.findMany({
    where: {
      orders: {
        some: {
          status: { in: ["PAID", "FULFILLED"] },
          items: { some: { productId } },
        },
      },
    },
    select: { email: true, name: true },
    distinct: ["id"],
    take: 500,
  });
  const libraryUrl = appUrl("/portal/library");
  for (const buyer of buyers) {
    const html = [
      `<p>Hi ${esc(buyer.name)},</p>`,
      `<p><strong>${esc(product.name)}</strong> has a new version: <strong>${esc(version)}</strong>.</p>`,
      changelog ? `<p>${esc(changelog)}</p>` : "",
      libraryUrl ? `<p><a href="${libraryUrl}">Download the new version</a> — it is already in your library.</p>` : "",
      `<p>— N3xUs Konc3pt'z</p>`,
    ].join("");
    await deliver("product update", buyer.email, `${product.name} — version ${version} is available`, html);
  }
}

// Quote accepted notice: confirms acceptance to the client and tells them
// the deposit invoice has been created.
export async function sendQuoteAcceptedEmail(quoteInvoiceId: string, depositInvoiceId: string) {
  const quote = await prisma.invoice.findUnique({
    where: { id: quoteInvoiceId },
    include: { user: { select: { email: true, name: true } }, project: { select: { title: true } } },
  });
  const deposit = await prisma.invoice.findUnique({ where: { id: depositInvoiceId }, select: { invoiceNumber: true, totalCents: true, currency: true } });
  if (!quote?.user?.email || !deposit) return;
  const depositUrl = appUrl(`/portal/invoices/${depositInvoiceId}`);
  const html = [
    `<p>Hi ${esc(quote.user.name)},</p>`,
    `<p>You accepted quote <strong>${esc(quote.invoiceNumber)}</strong>${quote.project ? ` for <strong>${esc(quote.project.title)}</strong>` : ""}. Thank you — we are ready to start.</p>`,
    `<p>The 50% deposit invoice <strong>${esc(deposit.invoiceNumber)}</strong> (${money(deposit.totalCents, deposit.currency)}) has been created. Once it is sent to you, you can pay it from your account to kick the project off.</p>`,
    depositUrl ? `<p><a href="${depositUrl}">View the deposit invoice</a></p>` : "",
    `<p>— N3xUs Konc3pt'z</p>`,
  ].join("");
  await deliver("quote accepted", quote.user.email, `Quote accepted — ${quote.invoiceNumber}`, html);
}

const PROJECT_STATUS_LABEL: Record<string, string> = {
  INQUIRY: "Inquiry",
  QUOTED: "Quoted",
  ACTIVE: "In progress",
  REVIEW: "In review",
  COMPLETED: "Completed",
  ON_HOLD: "On hold",
};

// Project update notice: sent when an admin changes a project's status or
// progress. `changes` is a short human list, e.g. ["Status: In progress",
// "Progress: 40%"].
export async function sendProjectUpdateEmail(projectId: string, changes: string[]) {
  if (!changes.length) return;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { client: { select: { email: true, name: true } } },
  });
  if (!project?.client?.email) return;
  const portalUrl = appUrl("/portal");
  const list = changes.map((change) => `<li>${esc(change)}</li>`).join("");
  const html = [
    `<p>Hi ${esc(project.client.name)},</p>`,
    `<p>An update on your project <strong>${esc(project.title)}</strong>:</p>`,
    `<ul>${list}</ul>`,
    portalUrl ? `<p><a href="${portalUrl}">View your project</a></p>` : "",
    `<p>— N3xUs Konc3pt'z</p>`,
  ].join("");
  await deliver("project update", project.client.email, `Project update: ${project.title}`, html);
}

export function projectStatusLabel(status: string): string {
  return PROJECT_STATUS_LABEL[status] ?? status;
}
