import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { CommandCenter } from "@/components/command-center";

export const dynamic = "force-dynamic";

export default async function CommandCenterPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["OWNER", "ADMIN"].includes(user.role)) redirect("/portal");
  return <main className="container section">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div><p className="eyebrow">NEXCON / EXECUTIVE COMMAND CENTER</p><h1 className="mt-3 text-3xl font-semibold">Command center.</h1><p className="mt-2 text-sm text-slate-400">Verified paid revenue, CRM pipeline forecast and customer lifecycle — one view.</p></div>
      <div className="flex gap-2"><Link href="/admin" className="btn-secondary">Admin home</Link><Link href="/admin/analytics" className="btn-primary">Business analytics</Link></div>
    </div>
    <CommandCenter />
  </main>;
}
