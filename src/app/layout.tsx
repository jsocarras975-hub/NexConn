import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PwaInstall } from "@/components/pwa-install";
import { STUDIO } from "@/data/studio";

export const metadata: Metadata = {
  title: { default: "N3xUs Konc3pt'z — Web Design, Development & Hosting", template: "%s | N3xUs Konc3pt'z" },
  description: STUDIO.metaDescription,
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  manifest: "/manifest.webmanifest",
  openGraph: { title: "N3xUs Konc3pt'z", description: STUDIO.metaDescription, type: "website" },
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en">
    <head>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
    </head>
    <body><SiteHeader />{children}<SiteFooter /><PwaInstall /></body>
  </html>;
}
