import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";

const createSchema = z.object({
  subject: z.string().trim().min(4).max(140),
  message: z.string().trim().min(10).max(4000),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where = ["OWNER", "ADMIN"].includes(user.role) ? {} : { userId: user.id };
  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      // Cap messages per ticket: an unbounded include turns 100 tickets
      // into the whole message history. Latest 50, re-ordered oldest-first
      // for the UI.
      messages: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { author: { select: { id: true, name: true, role: true } } },
      },
    },
    take: 100,
  });
  for (const ticket of tickets) ticket.messages.reverse();
  return NextResponse.json({ tickets });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = await enforceRateLimit(req, {
    name: "ticket-create",
    limit: 10,
    windowSeconds: 60 * 60,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many support requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the ticket details." }, { status: 400 });

  try {
    const ticket = await prisma.ticket.create({
      data: {
        userId: user.id,
        subject: parsed.data.subject,
        priority: parsed.data.priority,
        messages: { create: { authorId: user.id, body: parsed.data.message } },
      },
      include: { messages: true },
    });
    return NextResponse.json({ ticket }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create support ticket." }, { status: 500 });
  }
}
