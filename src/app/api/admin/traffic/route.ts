import { NextResponse } from "next/server";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store, max-age=0" };

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const auth = await requireAdmin(noStore);
  if ("error" in auth) return auth.error;
  const user = auth.user;

  const now = new Date();
  const start = new Date(now.getTime() - 30 * 86400000);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // Aggregate in SQL. The old version fetched up to 50,000 rows ordered
  // oldest-first and aggregated in JS, so once 30-day views passed 50k the
  // newest rows — the ones the owner cares about — were silently dropped.
  type CountRow = { views: bigint; visitors: bigint };
  type DayRow = { day: Date; views: bigint; visitors: bigint };
  type TopRow = { name: string; views: bigint };
  let totals: CountRow[] = [];
  let today: CountRow[] = [];
  let days: DayRow[] = [];
  let pages: TopRow[] = [];
  let referrers: TopRow[] = [];
  let countries: TopRow[] = [];
  try {
    [totals, today, days, pages, referrers, countries] = await Promise.all([
      prisma.$queryRaw<CountRow[]>`SELECT COUNT(*)::bigint AS views, COUNT(DISTINCT "ipHash")::bigint AS visitors FROM "PageView" WHERE "createdAt" >= ${start}`,
      prisma.$queryRaw<CountRow[]>`SELECT COUNT(*)::bigint AS views, COUNT(DISTINCT "ipHash")::bigint AS visitors FROM "PageView" WHERE "createdAt" >= ${todayStart}`,
      prisma.$queryRaw<DayRow[]>`SELECT DATE("createdAt") AS day, COUNT(*)::bigint AS views, COUNT(DISTINCT "ipHash")::bigint AS visitors FROM "PageView" WHERE "createdAt" >= ${start} GROUP BY DATE("createdAt") ORDER BY day ASC`,
      prisma.$queryRaw<TopRow[]>`SELECT path AS name, COUNT(*)::bigint AS views FROM "PageView" WHERE "createdAt" >= ${start} GROUP BY path ORDER BY views DESC LIMIT 10`,
      // Referrer is a full URL; group by its host (www. stripped), "Direct" when empty or not a URL.
      prisma.$queryRaw<TopRow[]>`SELECT CASE WHEN referrer IS NULL OR referrer = '' THEN 'Direct' WHEN referrer LIKE 'http://%' OR referrer LIKE 'https://%' THEN COALESCE(NULLIF(REGEXP_REPLACE(SPLIT_PART(referrer, '/', 3), '^www\\.', ''), ''), 'Direct') ELSE 'Direct' END AS name, COUNT(*)::bigint AS views FROM "PageView" WHERE "createdAt" >= ${start} GROUP BY name ORDER BY views DESC LIMIT 10`,
      prisma.$queryRaw<TopRow[]>`SELECT country AS name, COUNT(*)::bigint AS views FROM "PageView" WHERE "createdAt" >= ${start} AND country IS NOT NULL AND country <> '' GROUP BY country ORDER BY views DESC LIMIT 10`,
    ]);
  } catch {
    // PageView table may not exist yet if the migration has not run.
    // Return empty stats rather than failing the command center.
    totals = []; today = []; days = []; pages = []; referrers = []; countries = [];
  }

  const dayMap = new Map(days.map((d) => [dayKey(new Date(d.day)), { views: Number(d.views), visitors: Number(d.visitors) }]));
  const daily: { date: string; views: number; visitors: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = dayKey(d);
    const row = dayMap.get(key);
    daily.push({ date: key, views: row?.views || 0, visitors: row?.visitors || 0 });
  }

  const top = (rows: TopRow[]) => rows.map((r) => ({ name: r.name, views: Number(r.views) }));

  return NextResponse.json({
    totalViews: Number(totals[0]?.views ?? 0),
    uniqueVisitors: Number(totals[0]?.visitors ?? 0),
    todayViews: Number(today[0]?.views ?? 0),
    todayVisitors: Number(today[0]?.visitors ?? 0),
    daily,
    topPages: top(pages),
    topReferrers: top(referrers),
    topCountries: top(countries),
  }, { headers: noStore });
}
