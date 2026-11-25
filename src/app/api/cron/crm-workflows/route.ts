import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runOverdueTaskWorkflows } from "@/lib/crm-workflows";
import { runInvoiceOverdueSweep } from "@/lib/invoice-reminders";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Timing-safe comparison: a plain !== leaks, through response time, how
// many leading characters of the secret the caller got right. Hash both
// sides first so the comparison is over fixed-length digests.
function secretsEqual(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 503 });
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ") || !secretsEqual(authorization.slice("Bearer ".length), secret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const result = await runOverdueTaskWorkflows();
    // Invoice sweep: flip past-due invoices to OVERDUE and send the 3/7/14
    // day reminders. Its own try/catch so a mail problem never blocks the
    // workflow run or the retention pass below.
    let invoiceSweep = { markedOverdue: 0, remindersSent: 0 };
    try {
      invoiceSweep = await runInvoiceOverdueSweep();
    } catch (error) {
      console.error("Invoice overdue sweep failed", error);
    }
    // Retention: the append-only tables grow without bounds. Page views and
    // webhook events are only useful for 90 days; audit rows are kept a year.
    const now = Date.now();
    const [pageViews, webhookEvents, auditLogs] = await Promise.all([
      prisma.pageView.deleteMany({ where: { createdAt: { lt: new Date(now - 90 * 86400000) } } }),
      prisma.stripeWebhookEvent.deleteMany({ where: { createdAt: { lt: new Date(now - 90 * 86400000) } } }),
      prisma.auditLog.deleteMany({ where: { createdAt: { lt: new Date(now - 365 * 86400000) } } }),
    ]);
    return NextResponse.json(
      { ok: true, ...result, invoices: invoiceSweep, pruned: { pageViews: pageViews.count, webhookEvents: webhookEvents.count, auditLogs: auditLogs.count } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("CRM scheduled workflow execution failed", error);
    return NextResponse.json({ error: "Workflow execution failed." }, { status: 500 });
  }
}
