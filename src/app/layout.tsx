import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PwaInstall } from "@/components/pwa-install";

export const metadata: Metadata = {
  title: { default: "NEXCON | Digital Systems, Engineered to Scale", template: "%s | NEXCON" },
  description: "NEXCON designs, builds, and operates digital products, intelligent automations, and scalable web platforms.",
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  manifest: "/manifest.webmanifest",
  openGraph: { title: "NEXCON", description: "Digital systems, engineered to scale.", type: "website" },
  appleWebApp: { capable: true, title: "NEXCON", statusBarStyle: "black-translucent" },
  // Next 15 emits the standard "mobile-web-app-capable"; older iOS Safari
  // still looks for the Apple-prefixed name, so send both.
  other: { "apple-mobile-web-app-capable": "yes" },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = { themeColor: "#080b12" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><SiteHeader />{children}<SiteFooter /><PwaInstall /></body></html>;
}
