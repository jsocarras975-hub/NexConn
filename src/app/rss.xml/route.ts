import { JOURNAL, STUDIO } from "@/data/studio";

// Always build fresh from the data — never serve a cached feed, so a new
// journal post shows up immediately.
export const dynamic = "force-dynamic";

const base = (process.env.APP_URL || "https://n3xuskonc3ptz.com").replace(/\/$/, "");

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET() {
  const items = JOURNAL.map(
    (p) => `  <item>
    <title>${esc(p.title)}</title>
    <link>${base}/journal/${p.slug}</link>
    <guid>${base}/journal/${p.slug}</guid>
    <pubDate>${new Date(`${p.date}T12:00:00Z`).toUTCString()}</pubDate>
    <description>${esc(p.dek)}</description>
  </item>`,
  ).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(STUDIO.name)} — Journal</title>
    <link>${base}/journal</link>
    <description>Notes from the N3xUs desk on bots, type, hiring, hosting, and how a small studio actually ships.</description>
${items}
  </channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
