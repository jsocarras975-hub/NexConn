import { JOURNAL, SERVICES, STORE_PRODUCTS, WORK } from "@/data/studio";

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

export async function GET() {
  const urls = [
    ...staticRoutes,
    ...SERVICES.map((s) => `/services/${s.slug}`),
    ...WORK.map((w) => `/work/${w.slug}`),
    // Store products have no /store/[slug] page; their detail pages live in
    // the marketplace under the same slug.
    ...STORE_PRODUCTS.map((p) => `/marketplace/${p.slug}`),
    ...JOURNAL.map((p) => `/journal/${p.slug}`),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${base}${u === "" ? "/" : u}</loc></url>`).join("\n")}
</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
