import { prisma } from "@/lib/prisma";

// Client IP for audit rows. Only the platform-set header is trusted —
// x-forwarded-for is client controlled and must never be used to identify
// the caller.
export function clientIp(req: Request): string | null {
  return req.headers.get("x-real-ip")?.trim() || null;
}

export async function auditLog(input: {
  actorId?: string | null;
  action: string;
  target?: string | null;
  metadata?: Record<string, unknown>;
  req?: Request;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        target: input.target ?? null,
        // Prisma's Json input type does not accept a plain Record; a
        // JSON round-trip produces a value it accepts.
        metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
        ipAddress: input.req ? clientIp(input.req) : null,
      },
    });
  } catch {
    // Audit logging must never break the request it records.
  }
}
