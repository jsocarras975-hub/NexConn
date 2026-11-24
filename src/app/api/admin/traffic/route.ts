import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store, max-age=0" };

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function referrerDomain(referrer: string | null) {
  if (!referrer) return "Direct";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    return host || "Direct";
  } catch {
    return "Direct";
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  if (!["OWNER", "ADMIN"].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: noStore });

  const now = new Date();
  const start = new Date(now.getTime() - 30 * 86400000);
  const todayKey = dayKey(now);

  let views: { path: string; referrer: string | null; country: string | null; ipHash: string | null; createdAt: Date }[] = [];
  try {
    views = await prisma.pageView.findMany({
      where: { createdAt: { gte: start } },
      orderBy: { createdAt: "asc" },
      take: 50000,
      select: { path: true, referrer: true, country: true, ipHash: true, createdAt: true },
    });
  } catch {
    // PageView table may not exist yet if the migration has not run.
    // Return empty stats rather than failing the command center.
    views = [];
  }

  const dailyMap = new Map<string, { views: number; visitors: Set<string> }>();
  const pageMap = new Map<string, number>();
  const refMap = new Map<string, number>();
  const countryMap = new Map<string, number>();
  const visitors30 = new Set<string>();
  let todayViews = 0;
  const todayVisitors = new Set<string>();

  for (const v of views) {
    const day = dayKey(v.createdAt);
    let d = dailyMap.get(day);
    if (!d) { d = { views: 0, visitors: new Set() }; dailyMap.set(day, d); }
    d.views += 1;
    if (v.ipHash) { d.visitors.add(v.ipHash); visitors30.add(v.ipHash); }
    pageMap.set(v.path, (pageMap.get(v.path) || 0) + 1);
    refMap.set(referrerDomain(v.referrer), (refMap.get(referrerDomain(v.referrer)) || 0) + 1);
    if (v.country) countryMap.set(v.country, (countryMap.get(v.country) || 0) + 1);
    if (day === todayKey) {
      todayViews += 1;
      if (v.ipHash) todayVisitors.add(v.ipHash);
    }
  }

  const daily: { date: string; views: number; visitors: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = dayKey(d);
    const row = dailyMap.get(key);
    daily.push({ date: key, views: row?.views || 0, visitors: row?.visitors.size || 0 });
  }

  const top = (m: Map<string, number>, n = 10) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, views]) => ({ name, views }));

  return NextResponse.json({
    totalViews: views.length,
    uniqueVisitors: visitors30.size,
    todayViews,
    todayVisitors: todayVisitors.size,
    daily,
    topPages: top(pageMap),
    topReferrers: top(refMap),
    topCountries: top(countryMap),
  }, { headers: noStore });
}
