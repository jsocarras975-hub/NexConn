// Daily invoice sweep, run from the cron route:
//  1. Flip SENT invoices past their due date to OVERDUE, so the stored
//     status matches what the due date already says (reports and filters
//     that read the status column now agree with the computed metric).
//  2. Send payment reminders at 3, 7 and 14 days overdue. Each reminder is
//     recorded as an INVOICE_REMINDER_SENT audit entry, which doubles as the
//     dedupe ledger: a re-run of the cron on the same day will not send the
//     same reminder twice.

import { prisma } from "@/lib/prisma";
import { sendInvoiceReminderEmail } from "@/lib/transactional-email";

const REMINDER_DAYS = [3, 7, 14];
const DAY_MS = 86400000;

export async function runInvoiceOverdueSweep(now = new Date()) {
  const flipped = await prisma.invoice.updateMany({
    where: { status: "SENT", dueAt: { not: null, lt: now } },
    data: { status: "OVERDUE" },
  });
  if (flipped.count) {
    await prisma.auditLog.create({
      data: { action: "INVOICES_MARKED_OVERDUE", metadata: { count: flipped.count } },
    });
  }

  // Candidates: anything payable and past due. Days overdue is computed from
  // the due date, so an invoice lands on each reminder threshold exactly
  // once as the days advance.
  const candidates = await prisma.invoice.findMany({
    where: { status: { in: ["SENT", "OVERDUE"] }, dueAt: { not: null, lt: now } },
    select: { id: true, dueAt: true },
    orderBy: { dueAt: "asc" },
    take: 500,
  });

  let remindersSent = 0;
  for (const invoice of candidates) {
    if (!invoice.dueAt) continue;
    const daysOverdue = Math.floor((now.getTime() - invoice.dueAt.getTime()) / DAY_MS);
    if (!REMINDER_DAYS.includes(daysOverdue)) continue;

    const recent = await prisma.auditLog.findMany({
      where: {
        action: "INVOICE_REMINDER_SENT",
        target: invoice.id,
        createdAt: { gt: new Date(now.getTime() - 2 * DAY_MS) },
      },
      select: { metadata: true },
    });
    const alreadySent = recent.some((entry) => {
      const meta = entry.metadata as { daysOverdue?: number } | null;
      return meta?.daysOverdue === daysOverdue;
    });
    if (alreadySent) continue;

    await sendInvoiceReminderEmail(invoice.id, daysOverdue);
    await prisma.auditLog.create({
      data: { action: "INVOICE_REMINDER_SENT", target: invoice.id, metadata: { daysOverdue } },
    });
    remindersSent++;
  }

  return { markedOverdue: flipped.count, remindersSent };
}
