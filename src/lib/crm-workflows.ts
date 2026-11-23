import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[ch] || ch);
}

async function claimRun(workflowId: string, dedupeKey: string) {
  try {
    return await prisma.crmWorkflowRun.create({
      data: { workflowId, dedupeKey, status: "RUNNING" },
      select: { id: true },
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return null;
    throw error;
  }
}

export async function runInquiryWorkflows(inquiryId: string) {
  const inquiry = await prisma.inquiry.findUnique({ where: { id: inquiryId } });
  if (!inquiry) return;
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
  const workflows = await prisma.crmWorkflow.findMany({ where: { enabled: true, trigger: "TASK_OVERDUE", action: "EMAIL_OWNER" } });
  const tasks = await prisma.crmTask.findMany({
    where: { status: { in: ["OPEN","IN_PROGRESS"] }, dueAt: { lt: now } },
    orderBy: { dueAt: "asc" }, take: 100,
    select: { id: true, title: true, dueAt: true, priority: true },
  });
  let succeeded = 0, failed = 0, skipped = 0;
  for (const workflow of workflows) {
    for (const task of tasks) {
      const claim = await claimRun(workflow.id, `overdue-task:${task.id}:${task.dueAt?.toISOString() || "none"}`);
      if (!claim) { skipped++; continue; }
      try {
        const to = process.env.OWNER_EMAIL;
        if (!to) throw new Error("OWNER_EMAIL is not configured.");
        await sendEmail({
          to,
          subject: `NEXCON follow-up overdue: ${task.title}`,
          html: `<p>A CRM follow-up task is overdue.</p><p><strong>${escapeHtml(task.title)}</strong></p><p>Priority: ${escapeHtml(task.priority)}</p><p>Due: ${task.dueAt?.toISOString() || "Not set"}</p>`,
        });
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
