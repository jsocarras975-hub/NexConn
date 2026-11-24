import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const body = await req.json().catch(() => null);
    const path = typeof body?.path === "string" ? body.path.split("?")[0].split("#")[0] : "";
    if (!isTrackable(path)) return new NextResponse(null, { status: 204 });

    const referer = req.headers.get("referer") || (typeof body?.referrer === "string" ? body.referrer : "") || null;
    const userAgent = req.headers.get("user-agent") || null;
    const country = req.headers.get("x-vercel-ip-country") || null;
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = (forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip")) || null;
    const ipHash = ip ? createHash("sha256").update(ip).digest("hex") : null;

    await prisma.pageView.create({
      data: { path, referrer: referer, userAgent, country, ipHash },
    });
  } catch (e) {
    // Tracking must never break the page. Log and swallow.
    console.error("traffic track failed", e);
  }
  return new NextResponse(null, { status: 204 });
}
