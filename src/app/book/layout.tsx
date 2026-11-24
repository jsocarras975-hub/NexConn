import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/book", "Open a Brief", "Four questions. Weekday first response within 24 hours. Tell us what you want to build.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
