import { NextRequest, NextResponse } from "next/server";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const WEBHOOK_PATHS = new Set(["/api/webhooks/stripe"]);
// Pages whose URLs carry a bearer token. Prevent browser referrer leakage
// and caching while they are being viewed.
const TOKEN_PAGES = new Set(["/reset-password", "/verify-email"]);

function allowedOrigins(request: NextRequest): Set<string> {
  const origins = new Set<string>();

  // The configured canonical URL is the production source of truth.
  if (process.env.APP_URL) {
    try {
      origins.add(new URL(process.env.APP_URL).origin);
    } catch {
      // An invalid APP_URL is handled by deployment configuration checks.
    }
  }

  // Include the actual host receiving this request for Vercel preview deployments.
  // Only the origin is compared; arbitrary Origin values are never reflected.
  origins.add(request.nextUrl.origin);
  return origins;
}

export function middleware(request: NextRequest) {
  if (TOKEN_PAGES.has(request.nextUrl.pathname)) {
    const response = NextResponse.next();
    response.headers.set("Referrer-Policy", "no-referrer");
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  }

  if (!MUTATING_METHODS.has(request.method)) return NextResponse.next();
  if (WEBHOOK_PATHS.has(request.nextUrl.pathname)) return NextResponse.next();

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") {
    return NextResponse.json({ error: "Cross-site request rejected." }, { status: 403 });
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    return NextResponse.json({ error: "Origin header required." }, { status: 403 });
  }

  let normalizedOrigin: string;
  try {
    normalizedOrigin = new URL(origin).origin;
  } catch {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  if (!allowedOrigins(request).has(normalizedOrigin)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    // Next.js Server Actions use POST requests to page routes.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
