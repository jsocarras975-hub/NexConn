import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COOKIE = "nexcon_session";
const secret = () => {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET must be at least 32 characters.");
  return new TextEncoder().encode(value);
};

export async function createSession(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tokenVersion: true, disabled: true },
  });
  if (!user || user.disabled) throw new Error("Cannot create a session for this account.");

  const token = await new SignJWT({ sub: userId, ver: user.tokenVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("n3xuskonc3ptz")
    .setAudience("n3xuskonc3ptz-web")
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.set(COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), {
      algorithms: ["HS256"],
      issuer: "n3xuskonc3ptz",
      audience: "n3xuskonc3ptz-web",
    });
    if (!payload.sub || typeof payload.ver !== "number") return null;
    return await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, role: true, disabled: true, tokenVersion: true },
    }).then((user) =>
      user && !user.disabled && user.tokenVersion === payload.ver ? user : null
    );
  } catch {
    return null;
  }
}

export type AdminUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

// The one OWNER/ADMIN guard for API routes. Returns the signed-in admin, or
// a ready-to-return error response (401 when signed out, 403 when signed in
// as a client). Callers use it as:
//   const auth = await requireAdmin();
//   if ("error" in auth) return auth.error;
//   const user = auth.user;
// This replaces the OWNER/ADMIN check that was copy-pasted into every admin
// route. (The old requireOwner threw "FORBIDDEN", which an API route could
// not turn into a proper JSON response, so nothing used it.)
export async function requireAdmin(headers?: HeadersInit): Promise<{ user: AdminUser } | { error: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401, headers }) };
  if (!["OWNER", "ADMIN"].includes(user.role)) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403, headers }) };
  return { user };
}

// True when the user may act as staff (owner or admin). Used where a route
// serves both staff and the owning client, e.g. listing invoices/tickets.
export function isStaff(user: { role: string }): boolean {
  return ["OWNER", "ADMIN"].includes(user.role);
}
