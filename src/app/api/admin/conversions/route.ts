import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// One-click pipeline conversions: Inquiry → Lead → Project → Quote →
// (existing invoice send). Each step reuses the records and rules that
// already exist instead of inventing parallel ones:
//  - Inquiry → Lead dedupes exactly like the CREATE_LEAD_FROM_INQUIRY
//    workflow (same email + name + WEBSITE source) and keeps the inquiry
//    text as a lead note so nothing is lost.
//  - Lead → Project needs a registered client account (the same rule the
//    project create route enforces); the link is recorded in the audit log,
//    which is also how a repeat click finds the project it already made.
//  - Project → Quote creates the quote as a DRAFT invoice on the project
//    and flips the project to QUOTED; sending it is the existing invoice
//    status action, which already emails the customer.

const MAX_TOTAL_CENTS = 99999999;

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("inquiry-to-lead"), inquiryId: z.string().min(1) }),
  z.object({ action: z.literal("lead-to-project"), leadId: z.string().min(1) }),
  z.object({
    action: z.literal("project-to-quote"),
    projectId: z.string().min(1),
    items: z.array(z.object({
      description: z.string().trim().min(2).max(200),
      quantity: z.number().int().min(1).max(100),
      unitPriceCents: z.number().int().min(0).max(MAX_TOTAL_CENTS),
    })).min(1).max(50),
    dueAt: z.string().datetime().optional(),
  }),
]);

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const actor = auth.user;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid conversion request." }, { status: 400 });
  const body = parsed.data;

  if (body.action === "inquiry-to-lead") {
    const inquiry = await prisma.inquiry.findUnique({ where: { id: body.inquiryId } });
    if (!inquiry) return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });

    const existing = await prisma.crmLead.findFirst({
      where: { email: inquiry.email, name: inquiry.name, source: "WEBSITE" },
    });
    if (existing) return NextResponse.json({ lead: existing, alreadyExisted: true });

    const lead = await prisma.crmLead.create({
      data: {
        name: inquiry.name,
        email: inquiry.email,
        company: inquiry.company || null,
        source: "WEBSITE",
        stage: "NEW",
        createdById: actor.id,
      },
    });
    await prisma.crmNote.create({
      data: {
        leadId: lead.id,
        authorId: actor.id,
        body: [
          `Converted from website inquiry (${inquiry.service}).`,
          inquiry.budget ? `Budget: ${inquiry.budget}` : null,
          inquiry.timeline ? `Timeline: ${inquiry.timeline}` : null,
          `Details: ${inquiry.details}`,
        ].filter(Boolean).join("\n"),
      },
    });
    await prisma.auditLog.create({
      data: { actorId: actor.id, action: "INQUIRY_CONVERTED_TO_LEAD", target: lead.id, metadata: { inquiryId: inquiry.id } },
    });
    return NextResponse.json({ lead, alreadyExisted: false }, { status: 201 });
  }

  if (body.action === "lead-to-project") {
    const lead = await prisma.crmLead.findUnique({ where: { id: body.leadId } });
    if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });

    const prior = await prisma.auditLog.findFirst({
      where: { action: "LEAD_CONVERTED_TO_PROJECT", target: lead.id },
      orderBy: { createdAt: "desc" },
      select: { metadata: true },
    });
    const priorProjectId = (prior?.metadata as { projectId?: string } | null)?.projectId;
    if (priorProjectId) {
      const project = await prisma.project.findUnique({ where: { id: priorProjectId } });
      if (project) return NextResponse.json({ project, alreadyExisted: true });
    }

    // Resolve the client account: the lead's linked customer first, then a
    // registered account with the lead's email.
    let client = lead.customerId
      ? await prisma.user.findUnique({ where: { id: lead.customerId } })
      : null;
    if (!client && lead.email) {
      client = await prisma.user.findUnique({ where: { email: lead.email.toLowerCase() } });
    }
    if (!client) {
      return NextResponse.json({
        error: "No account exists for this lead's email. Ask them to register on the site first, then convert.",
      }, { status: 422 });
    }

    const project = await prisma.project.create({
      data: {
        clientId: client.id,
        title: lead.company ? `${lead.name} — ${lead.company}` : lead.name,
        summary: `Project created from CRM lead (${lead.source.toLowerCase()}${lead.email ? `, ${lead.email}` : ""}).`,
        budgetCents: lead.estimatedValueCents ?? undefined,
        status: "INQUIRY",
      },
    });
    await prisma.crmLead.update({
      where: { id: lead.id },
      data: { customerId: client.id, stage: "WON" },
    });
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "LEAD_CONVERTED_TO_PROJECT",
        target: lead.id,
        metadata: { projectId: project.id, clientId: client.id },
      },
    });
    return NextResponse.json({ project, alreadyExisted: false }, { status: 201 });
  }

  // project-to-quote
  const project = await prisma.project.findUnique({
    where: { id: body.projectId },
    select: { id: true, clientId: true, status: true },
  });
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  const totalCents = body.items.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
  if (totalCents < 1 || totalCents > MAX_TOTAL_CENTS) {
    return NextResponse.json({ error: "Quote total is outside the supported range." }, { status: 400 });
  }
  const invoiceNumber = `NX-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      userId: project.clientId,
      projectId: project.id,
      currency: "usd",
      subtotalCents: totalCents,
      totalCents,
      dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
      status: "DRAFT",
      items: { create: body.items },
    },
  });
  if (project.status === "INQUIRY") {
    await prisma.project.update({ where: { id: project.id }, data: { status: "QUOTED" } });
  }
  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "PROJECT_QUOTED",
      target: project.id,
      metadata: { invoiceId: invoice.id, totalCents },
    },
  });
  return NextResponse.json({ invoice }, { status: 201 });
}
