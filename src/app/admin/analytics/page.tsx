import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { BusinessAnalytics } from "@/components/business-analytics";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["OWNER", "ADMIN"].includes(user.role)) redirect("/portal");
  return <main className="container section">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div><p className="eyebrow">NEXCON / BUSINESS INTELLIGENCE</p><h1 className="mt-3 text-3xl font-semibold">Business analytics.</h1><p className="mt-2 text-sm text-slate-400">A 12-month view of verified marketplace payments, product sales and customer value.</p></div>
      <div className="flex gap-2"><Link href="/admin" className="btn-secondary">Admin home</Link><Link href="/admin/finance" className="btn-primary">Financial operations</Link></div>
    </div>
    <BusinessAnalytics/>
  </main>;
}
