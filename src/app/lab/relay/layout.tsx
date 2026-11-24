import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/lab/relay", "Relay — Telegram Shop Desk", "Hours, a menu, and a clean handoff — the Telegram Auto-Responder's brain, running here in the site.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
