import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CookieConsent } from "@/components/cookie-consent";
import { PwaInstall } from "@/components/pwa-install";
import { TrafficBeacon } from "@/components/traffic-beacon";
import { STUDIO } from "@/data/studio";
import { OG_IMAGE, safeJsonLd, SITE_NAME, SITE_URL } from "@/lib/seo";

// Self-hosted via next/font: no request to Google Fonts leaves the browser,
// and the fonts are subset and cached with the app.
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const siteDescription = STUDIO.metaDescription;

// Structured data: the studio as a ProfessionalService, so search engines
// can show the phone, email, and founder in rich results.
const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: SITE_NAME,
  description: siteDescription,
  url: SITE_URL,
  telephone: "+1-210-275-1837",
  email: STUDIO.email,
  founder: { "@type": "Person", name: STUDIO.founder, jobTitle: STUDIO.role },
  address: { "@type": "PostalAddress", addressRegion: "TX", addressCountry: "US" },
  priceRange: STUDIO.priceRange,
};

export const metadata: Metadata = {
  title: { default: "N3xUs Konc3pt'z — Web Design, Development & Hosting", template: "%s | N3xUs Konc3pt'z" },
  description: siteDescription,
  metadataBase: new URL(SITE_URL),
  keywords: ["web design San Antonio", "web development South Texas", "custom website", "Discord bot", "Telegram bot", "managed hosting", "SEO", "N3xUs Konc3pt'z"],
  authors: [{ name: STUDIO.founder }],
  creator: STUDIO.founder,
  publisher: SITE_NAME,
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: SITE_NAME,
    description: siteDescription,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: `${SITE_NAME} — ${siteDescription}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: siteDescription,
    images: [OG_IMAGE],
  },
  appleWebApp: { capable: true, title: "N3xUs Konc3pt'z", statusBarStyle: "black-translucent" },
  // Next 15 emits the standard "mobile-web-app-capable"; older iOS Safari
  // still looks for the Apple-prefixed name, so send both.
  other: { "apple-mobile-web-app-capable": "yes" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = { themeColor: "#080b12" };

import { getBusinessSetting } from "@/lib/settings";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const maintenanceNotice = await getBusinessSetting("maintenance_notice");
  return <html lang="en" className={`${plexSans.variable} ${plexMono.variable}`}>
    <head>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(orgJsonLd) }} />
    </head>
    <body>
      {maintenanceNotice && (
        <div className="bg-amber-400 px-4 py-2 text-center text-sm font-medium text-amber-950" role="status">
          {maintenanceNotice}
        </div>
      )}
      <SiteHeader />{children}<SiteFooter /><PwaInstall /><TrafficBeacon /><CookieConsent />
    </body>
  </html>;
}
