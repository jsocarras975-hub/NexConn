import { JOURNAL, SERVICES, STORE_PRODUCTS, WORK } from "@/data/studio";

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
  "/cart",
];

// Journal posts carry a publish date; the journal index tracks the newest
// one. Everything else has no reliable modified date in the data, so it
// ships without <lastmod> rather than a made-up one.
const latestJournalDate = JOURNAL.reduce((max, p) => (p.date > max ? p.date : max), JOURNAL[0]?.date ?? "");

type Entry = { loc: string; lastmod?: string };
const entry = (loc: string, lastmod?: string): Entry => ({ loc, lastmod });

export async function GET() {
  const urls: Entry[] = [
    ...staticRoutes.map((u) => entry(u === "" ? "/" : u, u === "/journal" ? latestJournalDate : undefined)),
    ...SERVICES.map((s) => entry(`/services/${s.slug}`)),
    ...WORK.map((w) => entry(`/work/${w.slug}`)),
    // Store products have no /store/[slug] page; their detail pages live in
    // the marketplace under the same slug.
    ...STORE_PRODUCTS.map((p) => entry(`/marketplace/${p.slug}`)),
    ...JOURNAL.map((p) => entry(`/journal/${p.slug}`, p.date)),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${base}${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`).join("\n")}
</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
