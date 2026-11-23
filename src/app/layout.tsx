import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: { default: "NEXCON | Digital Systems, Engineered to Scale", template: "%s | NEXCON" },
  description: "NEXCON designs, builds, and operates digital products, intelligent automations, and scalable web platforms.",
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  openGraph: { title: "NEXCON", description: "Digital systems, engineered to scale.", type: "website" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><SiteHeader />{children}<SiteFooter /></body></html>;
}
