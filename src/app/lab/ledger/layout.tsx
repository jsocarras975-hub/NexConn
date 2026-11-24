import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/lab/ledger", "Ledger — Discord Economy Sandbox", "The Discord economy pattern running in your browser: credits, jobs, a shop, inventory. Same Postgres-backed pattern as the template.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
