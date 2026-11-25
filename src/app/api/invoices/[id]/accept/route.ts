import { NextResponse, after } from "next/server";
import { randomUUID } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { sendQuoteAcceptedEmail } from "@/lib/transactional-email";

export const runtime = "nodejs";

// The client accepts a quote (a DRAFT invoice attached to a project).
// Accepting stamps the quote, starts the project, and creates the 50%
// deposit invoice in DRAFT — the studio sends it with the normal invoice
// flow, and the client pays it online like any other invoice. The rest of
// the balance is milestone invoices on the same project.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to accept this quote." }, { status: 401 });

  const limit = await enforceRateLimit(req, {
    name: "invoice-accept",
    limit: 10,
    windowSeconds: 60 * 60,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const { id } = await params;
  const quote = await prisma.invoice.findFirst({
    where: { id, userId: user.id },
    include: { deposit: { select: { id: true } } },
  });
  if (!quote) return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  if (!quote.projectId) return NextResponse.json({ error: "Only project quotes can be accepted here." }, { status: 409 });
  if (quote.status !== "DRAFT") return NextResponse.json({ error: "This quote is no longer open for acceptance." }, { status: 409 });
  if (quote.acceptedAt || quote.deposit) return NextResponse.json({ error: "This quote has already been accepted." }, { status: 409 });

  const projectId = quote.projectId;
  const depositTotalCents = Math.max(1, Math.round(quote.totalCents / 2));
  const depositNumber = `NX-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;

  try {
    const depositId = await prisma.$transaction(async (tx) => {
      const stamped = await tx.invoice.updateMany({
        where: { id: quote.id, status: "DRAFT", acceptedAt: null },
        data: { acceptedAt: new Date() },
      });
      if (stamped.count !== 1) throw new Error("Quote state changed.");

      const deposit = await tx.invoice.create({
        data: {
          invoiceNumber: depositNumber,
          userId: user.id,
          projectId,
          currency: quote.currency,
          subtotalCents: depositTotalCents,
          totalCents: depositTotalCents,
          status: "DRAFT",
          depositOfId: quote.id,
          dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          notes: `50% deposit for quote ${quote.invoiceNumber}. The remaining balance is invoiced as milestones.`,
          items: {
            create: [{
              description: `Deposit (50%) — quote ${quote.invoiceNumber}`,
              quantity: 1,
              unitPriceCents: depositTotalCents,
            }],
          },
        },
        select: { id: true },
      });

      await tx.project.updateMany({
        where: { id: projectId, status: { in: ["INQUIRY", "QUOTED"] } },
        data: { status: "ACTIVE" },
      });
      await tx.auditLog.create({
        data: { actorId: user.id, action: "QUOTE_ACCEPTED", target: quote.id, metadata: { depositInvoiceId: deposit.id, depositTotalCents } },
      });
      await tx.auditLog.create({
        data: { actorId: user.id, action: "DEPOSIT_INVOICE_CREATED", target: deposit.id, metadata: { quoteInvoiceId: quote.id } },
      });
      return deposit.id;
    });

    after(async () => {
      try {
        await sendQuoteAcceptedEmail(quote.id, depositId);
      } catch (error) {
        console.error("Quote accepted email failed", error);
      }
    });

    return NextResponse.json({ depositInvoiceId: depositId, depositInvoiceNumber: depositNumber });
  } catch (error) {
    console.error("Quote acceptance failed", error);
    return NextResponse.json({ error: "Unable to accept this quote. It may have just been accepted — refresh and check." }, { status: 409 });
  }
}
