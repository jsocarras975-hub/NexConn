import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/lab", "Lab", "Try the bots before you buy them. Ledger, Relay, and House run right here in the browser — sandbox credits, real command surface.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
