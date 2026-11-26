import { JOURNAL, WORK } from "@/data/studio";
import { prisma } from "@/lib/prisma";
import { getServices } from "@/lib/services";

// Always build fresh from the data — never serve a cached sitemap, so a
// new journal post (or any content change) shows up immediately.
export const dynamic = "force-dynamic";

const base = (process.env.APP_URL || "https://n3xuskonc3ptz.com").replace(/\/$/, "");

const staticRoutes = [
  "",
  "/about",
  "/studio",
  "/services",
  "/work",
  "/store",
  "/lab",
  "/lab/ledger",
  "/lab/relay",
  "/lab/house",
  "/journal",
  "/book",
  "/contact",
  "/transmissions",
  "/marketplace",
  // /cart is deliberately absent: robots.txt disallows it, and a sitemap
  // must not list URLs the crawler is told not to visit.
];

// Journal posts carry a publish date; the journal index tracks the newest
// one. Everything else has no reliable modified date in the data, so it
// ships without <lastmod> rather than a made-up one.
const latestJournalDate = JOURNAL.reduce((max, p) => (p.date > max ? p.date : max), JOURNAL[0]?.date ?? "");

type Entry = { loc: string; lastmod?: string };
const entry = (loc: string, lastmod?: string): Entry => ({ loc, lastmod });

export async function GET() {
  // Product URLs come from the database, not the static catalog: only
  // products that are actually live and buyable belong in the sitemap.
  let products: { slug: string; updatedAt: Date }[] = [];
  try {
    products = await prisma.product.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } });
  } catch {
    // A sitemap must never 500 the whole site if the database is briefly
    // unreachable; the static and journal entries still go out.
    products = [];
  }
  const services = await getServices();
  const urls: Entry[] = [
    ...staticRoutes.map((u) => entry(u === "" ? "/" : u, u === "/journal" ? latestJournalDate : undefined)),
    ...services.map((s) => entry(`/services/${s.slug}`)),
    ...WORK.map((w) => entry(`/work/${w.slug}`)),
    // Store products have no /store/[slug] page; their detail pages live in
    // the marketplace under the same slug.
    ...products.map((p) => entry(`/marketplace/${p.slug}`, p.updatedAt.toISOString().slice(0, 10))),
    ...JOURNAL.map((p) => entry(`/journal/${p.slug}`, p.date)),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${base}${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`).join("\n")}
</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
