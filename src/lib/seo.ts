// Shared SEO helpers — one canonical base URL, one social image, per-page
// title/description/canonical. The canonical domain is n3xuskonc3ptz.com;
// APP_URL is set to it in Vercel Production, with the same value as fallback
// so previews and local builds still canonicalize to the live domain.
import type { Metadata } from "next";

export const SITE_URL = (process.env.APP_URL || "https://n3xuskonc3ptz.com").replace(/\/$/, "");
export const SITE_NAME = "N3xUs Konc3pt'z";
export const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export function pageMetadata(path: string, title: string, description: string): Metadata {
  const url = `${SITE_URL}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}
