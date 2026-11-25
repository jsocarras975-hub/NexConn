import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[ch] || ch);
}

// A claim is the dedupe guard: one live (RUNNING or SUCCEEDED) run per
// (workflow, dedupeKey). A FAILED claim — or a RUNNING claim older than the
// staleness window, i.e. orphaned by a crash — may be retried: delete it and
// claim again. Without this, a failed or crashed run blocks every retry.
const STALE_RUNNING_MS = 15 * 60 * 1000;

async function claimRun(workflowId: string, dedupeKey: string) {
  try {
    return await prisma.crmWorkflowRun.create({
      data: { workflowId, dedupeKey, status: "RUNNING" },
      select: { id: true },
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      const existing = await prisma.crmWorkflowRun.findUnique({
        where: { workflowId_dedupeKey: { workflowId, dedupeKey } },
      });
      if (!existing) return null;
      const staleRunning =
        existing.status === "RUNNING" &&
        existing.startedAt.getTime() < Date.now() - STALE_RUNNING_MS;
      if (existing.status === "FAILED" || staleRunning) {
        await prisma.crmWorkflowRun.delete({ where: { id: existing.id } });
        try {
          return await prisma.crmWorkflowRun.create({
            data: { workflowId, dedupeKey, status: "RUNNING" },
            select: { id: true },
          });
        } catch {
          return null;
        }
      }
      return null;
    }
    throw error;
  }
}

// Mark RUNNING claims orphaned by a crash as FAILED so they show up as failed
// instead of stuck, and so the claim-retry path above can re-run them.
async function recoverStaleRunningClaims() {
  await prisma.crmWorkflowRun.updateMany({
    where: {
      status: "RUNNING",
      startedAt: { lt: new Date(Date.now() - STALE_RUNNING_MS) },
    },
    data: {
      status: "FAILED",
      error: "Claim abandoned — recovered by a later run.",
      finishedAt: new Date(),
    },
  });
}

export async function runInquiryWorkflows(inquiryId: string) {
  const inquiry = await prisma.inquiry.findUnique({ where: { id: inquiryId } });
  if (!inquiry) return;
  await recoverStaleRunningClaims();
  const workflows = await prisma.crmWorkflow.findMany({ where: { enabled: true, trigger: "INQUIRY_CREATED" } });
  for (const workflow of workflows) {
    const claim = await claimRun(workflow.id, `inquiry:${inquiry.id}`);
    if (!claim) continue;
    try {
      if (workflow.action === "CREATE_LEAD_FROM_INQUIRY") {
        const existing = await prisma.crmLead.findFirst({ where: { email: inquiry.email, name: inquiry.name, source: "WEBSITE" } });
        const lead = existing || await prisma.crmLead.create({ data: {
          name: inquiry.name, email: inquiry.email, company: inquiry.company || null,
          source: "WEBSITE", stage: "NEW", createdById: workflow.createdById,
        }});
        await prisma.crmWorkflowRun.update({ where: { id: claim.id }, data: { status: "SUCCEEDED", result: { leadId: lead.id, inquiryId }, finishedAt: new Date() } });
      } else {
        await prisma.crmWorkflowRun.update({ where: { id: claim.id }, data: { status: "SKIPPED", result: { reason: "Unsupported action for inquiry trigger." }, finishedAt: new Date() } });
      }
    } catch (error) {
      await prisma.crmWorkflowRun.update({ where: { id: claim.id }, data: { status: "FAILED", error: error instanceof Error ? error.message.slice(0,1000) : "Workflow failed.", finishedAt: new Date() } });
    }
  }
}

export async function runOverdueTaskWorkflows() {
  const now = new Date();
  await recoverStaleRunningClaims();
  const workflows = await prisma.crmWorkflow.findMany({ where: { enabled: true, trigger: "TASK_OVERDUE", action: "EMAIL_OWNER" } });
  // Fetch a wide candidate set: taking only 100 oldest-first starves newer
  // overdue tasks, because the oldest 100 are usually already notified and
  // still occupy every slot. Filter to unclaimed tasks before slicing.
  const tasks = await prisma.crmTask.findMany({
    where: { status: { in: ["OPEN","IN_PROGRESS"] }, dueAt: { lt: now } },
    orderBy: { dueAt: "asc" }, take: 500,
    select: { id: true, title: true, dueAt: true, priority: true },
  });
  const overdueKey = (task: { id: string; dueAt: Date | null }) =>
    `overdue-task:${task.id}:${task.dueAt?.toISOString() || "none"}`;
  let succeeded = 0, failed = 0, skipped = 0;
  for (const workflow of workflows) {
    const claimed = await prisma.crmWorkflowRun.findMany({
      where: {
        workflowId: workflow.id,
        status: { in: ["RUNNING", "SUCCEEDED"] },
        dedupeKey: { startsWith: "overdue-task:" },
      },
      select: { dedupeKey: true },
    });
    const claimedKeys = new Set(claimed.map((r) => r.dedupeKey));
    const pending = tasks.filter((task) => !claimedKeys.has(overdueKey(task))).slice(0, 100);
    for (const task of pending) {
      const claim = await claimRun(workflow.id, overdueKey(task));
      if (!claim) { skipped++; continue; }
      try {
        const to = process.env.OWNER_EMAIL;
        if (!to) throw new Error("OWNER_EMAIL is not configured.");
        const result = await sendEmail({
          to,
          subject: `N3xUs Konc3pt'z follow-up overdue: ${task.title}`,
          html: `<p>A CRM follow-up task is overdue.</p><p><strong>${escapeHtml(task.title)}</strong></p><p>Priority: ${escapeHtml(task.priority)}</p><p>Due: ${task.dueAt?.toISOString() || "Not set"}</p>`,
        });
        // sendEmail returns {sent:false} instead of throwing — treat that as
        // a failure so the run is recorded FAILED and a later run retries it.
        if (!result.sent) throw new Error(result.reason || "Email could not be sent.");
        await prisma.crmWorkflowRun.update({ where: { id: claim.id }, data: { status: "SUCCEEDED", result: { taskId: task.id }, finishedAt: new Date() } });
        succeeded++;
      } catch (error) {
        await prisma.crmWorkflowRun.update({ where: { id: claim.id }, data: { status: "FAILED", error: error instanceof Error ? error.message.slice(0,1000) : "Workflow failed.", finishedAt: new Date() } });
        failed++;
      }
    }
  }
  return { workflows: workflows.length, tasks: tasks.length, succeeded, failed, skipped };
}
