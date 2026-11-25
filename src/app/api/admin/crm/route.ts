import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, max-age=0" };
const leadSchema = z.object({
  type: z.literal("lead"), name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).optional().or(z.literal("")),
  company: z.string().trim().max(120).optional(), phone: z.string().trim().max(40).optional(),
  source: z.enum(["WEBSITE","REFERRAL","SOCIAL","CAMPAIGN","OTHER"]).default("OTHER"),
  stage: z.enum(["NEW","CONTACTED","QUALIFIED","PROPOSAL","WON","LOST"]).default("NEW"),
  estimatedValueCents: z.number().int().min(0).max(1000000000).optional(),
  currency: z.string().length(3).default("usd"), customerId: z.string().optional(),
  nextFollowUpAt: z.string().datetime().optional(),
});
const taskSchema = z.object({
  type: z.literal("task"), title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional(),
  priority: z.enum(["LOW","NORMAL","HIGH","URGENT"]).default("NORMAL"),
  dueAt: z.string().datetime().optional(), customerId: z.string().optional(), leadId: z.string().optional(),
});
const noteSchema = z.object({
  type: z.literal("note"), body: z.string().trim().min(2).max(5000),
  customerId: z.string().optional(), leadId: z.string().optional(),
});
const communicationSchema = z.object({
  type: z.literal("communication"), channel: z.enum(["EMAIL","PHONE","MEETING","SMS","OTHER"]),
  direction: z.enum(["INBOUND","OUTBOUND"]).default("OUTBOUND"),
  subject: z.string().trim().max(200).optional(),
  summary: z.string().trim().min(2).max(3000),
  customerId: z.string().optional(), leadId: z.string().optional(),
  occurredAt: z.string().datetime().optional(),
});

async function authorized() {
  return requireAdmin(headers);
}
async function validateTargets(customerId?: string, leadId?: string) {
  if (customerId) {
    const customer = await prisma.user.findUnique({ where: { id: customerId }, select: { id: true, role: true } });
    if (!customer || customer.role !== "CLIENT") return "Customer not found.";
  }
  if (leadId && !await prisma.crmLead.findUnique({ where: { id: leadId }, select: { id: true } })) return "Lead not found.";
  return null;
}

export async function GET() {
  const auth = await authorized();
  if ("error" in auth) return auth.error;
  const now = new Date();
  const startToday = new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const endToday = new Date(now.getFullYear(),now.getMonth(),now.getDate()+1);
  // Insight counts come from COUNT queries, not from the fetched task list:
  // the list is capped at 300 and ordered by due date, so counting open
  // tasks from it would undercount once closed tasks fill the list.
  const [openTaskCount, overdueTaskCount, dueTodayTaskCount] = await Promise.all([
    prisma.crmTask.count({ where: { status: { in: ["OPEN","IN_PROGRESS"] } } }),
    prisma.crmTask.count({ where: { status: { in: ["OPEN","IN_PROGRESS"] }, dueAt: { lt: now } } }),
    prisma.crmTask.count({ where: { status: { in: ["OPEN","IN_PROGRESS"] }, dueAt: { gte: startToday, lt: endToday } } }),
  ]);
  const [leads,tasks,notes,communications,workflows,workflowRuns,inquiries,customers,orders,invoices] = await Promise.all([
    prisma.crmLead.findMany({ orderBy: { updatedAt: "desc" }, take: 200 }),
    // Most urgent first. Ordering by status alphabetically put OPEN last,
    // so open tasks were truncated out of the 300 and the insights skewed.
    prisma.crmTask.findMany({ orderBy: { dueAt: "asc" }, take: 300 }),
    prisma.crmNote.findMany({ orderBy: { createdAt: "desc" }, take: 300 }),
    prisma.crmCommunication.findMany({ orderBy: { occurredAt: "desc" }, take: 300 }),
    prisma.crmWorkflow.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.crmWorkflowRun.findMany({ orderBy: { startedAt: "desc" }, take: 100 }),
    prisma.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id:true,name:true,email:true,company:true,service:true,createdAt:true } }),
    prisma.user.findMany({ where: { role: "CLIENT" }, orderBy: { createdAt: "desc" }, take: 500, select: { id:true,createdAt:true } }),
    prisma.order.findMany({ where: { user: { role: "CLIENT" } }, orderBy: { createdAt: "desc" }, take: 5000, select: { userId:true,status:true } }),
    prisma.invoice.findMany({ where: { user: { role: "CLIENT" } }, orderBy: { createdAt: "desc" }, take: 5000, select: { userId:true } }),
  ]);
  const orderUsers = new Set(orders.filter(o => ["PAID","FULFILLED","REFUNDED"].includes(o.status) && o.userId).map(o => o.userId as string));
  const invoiceUsers = new Set(invoices.map(i => i.userId).filter((id): id is string => id !== null));
  const insights = {
    leadStages: ["NEW","CONTACTED","QUALIFIED","PROPOSAL","WON","LOST"].map(stage => ({ stage, count: leads.filter(l => l.stage === stage).length })),
    leadConversion: leads.length ? Math.round(leads.filter(l => l.stage === "WON").length / leads.length * 100) : 0,
    openTasks: openTaskCount,
    overdueTasks: overdueTaskCount,
    dueTodayTasks: dueTodayTaskCount,
    customerSegments: {
      marketplaceBuyers: customers.filter(c => orderUsers.has(c.id)).length,
      invoiceCustomers: customers.filter(c => invoiceUsers.has(c.id)).length,
      newAccounts: customers.filter(c => c.createdAt.getTime() >= now.getTime()-30*86400000).length,
      noRecordedPurchases: customers.filter(c => !orderUsers.has(c.id) && !invoiceUsers.has(c.id)).length,
    },
    sourceLimits: { customers:500,orders:5000,invoices:5000,inquiries:100,leads:200,tasks:300 },
  };
  return NextResponse.json({ leads,tasks,notes,communications,workflows,workflowRuns,inquiries,insights }, { headers });
}

const workflowSchema = z.object({
  type: z.literal("workflow"),
  name: z.string().trim().min(3).max(100),
  trigger: z.enum(["INQUIRY_CREATED","TASK_OVERDUE"]),
  action: z.enum(["CREATE_LEAD_FROM_INQUIRY","EMAIL_OWNER"]),
});

export async function POST(request: Request) {
  const auth = await authorized();
  if ("error" in auth) return auth.error;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request." }, { status: 400, headers });
  const audit = (action: string, target: string) =>
    prisma.auditLog.create({ data: { actorId: auth.user.id, action, target } }).catch(() => undefined);

  if (body.type === "workflow") {
    const parsed = workflowSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid workflow details." }, { status: 400, headers });
    const d = parsed.data;
    if ((d.trigger === "INQUIRY_CREATED" && d.action !== "CREATE_LEAD_FROM_INQUIRY") ||
        (d.trigger === "TASK_OVERDUE" && d.action !== "EMAIL_OWNER")) {
      return NextResponse.json({ error: "That trigger/action combination is not supported." }, { status: 400, headers });
    }
    const workflow = await prisma.crmWorkflow.create({ data: {
      name: d.name, trigger: d.trigger, action: d.action, config: {},
      enabled: true, createdById: auth.user.id,
    }});
    await audit("CRM_WORKFLOW_CREATED", workflow.id);
    return NextResponse.json({ workflow }, { status: 201, headers });
  }

  if (body.type === "lead") {
    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid lead details.", issues: parsed.error.flatten() }, { status: 400, headers });
    const d = parsed.data;
    if (d.customerId) {
      const error = await validateTargets(d.customerId);
      if (error) return NextResponse.json({ error }, { status: 400, headers });
    }
    const lead = await prisma.crmLead.create({ data: {
      name: d.name, email: d.email || null, company: d.company || null, phone: d.phone || null,
      source: d.source, stage: d.stage, estimatedValueCents: d.estimatedValueCents ?? null,
      currency: d.currency.toLowerCase(), customerId: d.customerId || null,
      nextFollowUpAt: d.nextFollowUpAt ? new Date(d.nextFollowUpAt) : null, createdById: auth.user.id,
    }});
    await audit("CRM_LEAD_CREATED", lead.id);
    return NextResponse.json({ lead }, { status: 201, headers });
  }
  if (body.type === "task") {
    const parsed = taskSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid task details." }, { status: 400, headers });
    const d = parsed.data;
    const error = await validateTargets(d.customerId, d.leadId);
    if (error) return NextResponse.json({ error }, { status: 400, headers });
    const task = await prisma.crmTask.create({ data: {
      title: d.title, description: d.description || null, priority: d.priority,
      dueAt: d.dueAt ? new Date(d.dueAt) : null, customerId: d.customerId || null,
      leadId: d.leadId || null, createdById: auth.user.id,
    }});
    await audit("CRM_TASK_CREATED", task.id);
    return NextResponse.json({ task }, { status: 201, headers });
  }
  if (body.type === "note") {
    const parsed = noteSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid note details." }, { status: 400, headers });
    const d = parsed.data;
    if (!d.customerId && !d.leadId) return NextResponse.json({ error: "A customer or lead is required." }, { status: 400, headers });
    const error = await validateTargets(d.customerId, d.leadId);
    if (error) return NextResponse.json({ error }, { status: 400, headers });
    const note = await prisma.crmNote.create({ data: { body: d.body, customerId: d.customerId || null, leadId: d.leadId || null, authorId: auth.user.id } });
    await audit("CRM_NOTE_CREATED", note.id);
    return NextResponse.json({ note }, { status: 201, headers });
  }
  if (body.type === "communication") {
    const parsed = communicationSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid communication details." }, { status: 400, headers });
    const d = parsed.data;
    if (!d.customerId && !d.leadId) return NextResponse.json({ error: "A customer or lead is required." }, { status: 400, headers });
    const error = await validateTargets(d.customerId, d.leadId);
    if (error) return NextResponse.json({ error }, { status: 400, headers });
    const communication = await prisma.crmCommunication.create({ data: {
      channel: d.channel, direction: d.direction, subject: d.subject || null, summary: d.summary,
      customerId: d.customerId || null, leadId: d.leadId || null,
      authorId: auth.user.id, occurredAt: d.occurredAt ? new Date(d.occurredAt) : new Date(),
    }});
    await audit("CRM_COMMUNICATION_CREATED", communication.id);
    return NextResponse.json({ communication }, { status: 201, headers });
  }
  return NextResponse.json({ error: "Unknown CRM record type." }, { status: 400, headers });
}

export async function PATCH(request: Request) {
  const auth = await authorized();
  if ("error" in auth) return auth.error;
  const body = await request.json().catch(() => null);
  const schema = z.discriminatedUnion("type", [
    z.object({ type: z.literal("lead"), id: z.string().min(1), stage: z.enum(["NEW","CONTACTED","QUALIFIED","PROPOSAL","WON","LOST"]) }),
    z.object({ type: z.literal("task"), id: z.string().min(1), status: z.enum(["OPEN","IN_PROGRESS","COMPLETED","CANCELLED"]) }),
    z.object({ type: z.literal("workflow"), id: z.string().min(1), enabled: z.boolean() }),
  ]);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400, headers });
  const audit = (action: string, target: string) =>
    prisma.auditLog.create({ data: { actorId: auth.user.id, action, target } }).catch(() => undefined);
  try {
    if (parsed.data.type === "workflow") {
      const workflow = await prisma.crmWorkflow.update({ where: { id: parsed.data.id }, data: { enabled: parsed.data.enabled } });
      await audit("CRM_WORKFLOW_UPDATED", workflow.id);
      return NextResponse.json({ workflow }, { headers });
    }
    if (parsed.data.type === "lead") {
      const lead = await prisma.crmLead.update({ where: { id: parsed.data.id }, data: { stage: parsed.data.stage } });
      await audit("CRM_LEAD_UPDATED", lead.id);
      return NextResponse.json({ lead }, { headers });
    }
    const task = await prisma.crmTask.update({ where: { id: parsed.data.id }, data: { status: parsed.data.status } });
    await audit("CRM_TASK_UPDATED", task.id);
    return NextResponse.json({ task }, { headers });
  } catch (error) {
    // A bad id throws P2025 ("record not found") — that is a 404, not a 500.
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Record not found." }, { status: 404, headers });
    }
    console.error("CRM update failed", error);
    return NextResponse.json({ error: "Unable to update." }, { status: 500, headers });
  }
}
