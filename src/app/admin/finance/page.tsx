import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { FinanceDashboard } from "@/components/finance-dashboard";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["OWNER", "ADMIN"].includes(user.role)) redirect("/portal");
  return <main className="container section">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div><p className="eyebrow">NEXCON / FINANCE</p><h1 className="mt-3 text-3xl font-semibold">Financial operations.</h1><p className="mt-2 text-sm text-slate-400">A live overview of paid orders, invoices and outstanding balances.</p></div>
      <div className="flex gap-2"><Link href="/admin" className="btn-secondary">Admin home</Link><Link href="/admin/invoices" className="btn-primary">Manage invoices</Link></div>
    </div>
    <FinanceDashboard/>
  </main>;
}
