import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Paths that are never counted as web traffic: admin/owner tooling, auth
// pages, API calls, and static/asset requests. The beacon only fires on
// public pages, and this is the server-side backstop.
const BLOCKED_PREFIXES = [
  "/api", "/admin", "/owner", "/portal", "/login", "/register",
  "/forgot-password", "/reset-password", "/verify-email", "/offline",
  "/_next", "/sw.js", "/favicon.ico", "/manifest.webmanifest",
  "/robots.txt", "/sitemap.xml", "/rss",
];

function isTrackable(path: string) {
  if (!path.startsWith("/") || path.length > 500) return false;
  return !BLOCKED_PREFIXES.some((p) => path === p || path.startsWith(p + "/") || path.startsWith(p + "?"));
}

export async function POST(req: Request) {
  try {
    // Best-effort tracking: a flood of fake views must not fill the table.
    // Rate-limited per IP; a limited or unconfigured limiter just drops the
    // view instead of failing the page.
    const limit = await enforceRateLimit(req, { name: "traffic-track", limit: 120, windowSeconds: 10 * 60 });
    if (!limit.allowed) return new NextResponse(null, { status: 204 });

    const body = await req.json().catch(() => null);
    const path = typeof body?.path === "string" ? body.path.split("?")[0].split("#")[0] : "";
    if (!isTrackable(path)) return new NextResponse(null, { status: 204 });

    // Cap free-form fields so a hostile client cannot stuff the table with
    // unbounded strings.
    const referer = (req.headers.get("referer") || (typeof body?.referrer === "string" ? body.referrer : "") || null)?.slice(0, 2048) || null;
    const userAgent = (req.headers.get("user-agent") || null)?.slice(0, 1000) || null;
    const country = req.headers.get("x-vercel-ip-country") || null;
    // Only the platform-set header is trusted for the client IP.
    const ip = req.headers.get("x-real-ip")?.trim() || null;
    // HMAC with a server secret, not a bare hash: a plain SHA-256 of an IP
    // is reversible for IPv4 by brute force, which would turn the "no
    // personal data" claim into a lie. Only the HMAC key holder can test
    // whether a given IP produced a given hash.
    const hmacKey = process.env.IP_HASH_SALT || process.env.AUTH_SECRET || "";
    const ipHash = ip && hmacKey ? createHmac("sha256", hmacKey).update(ip).digest("hex") : null;

    await prisma.pageView.create({
      data: { path, referrer: referer, userAgent, country, ipHash },
    });
  } catch (e) {
    // Tracking must never break the page. Log and swallow.
    console.error("traffic track failed", e);
  }
  return new NextResponse(null, { status: 204 });
}
