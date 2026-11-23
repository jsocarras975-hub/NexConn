import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminOrders } from "@/components/admin-orders";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["OWNER", "ADMIN"].includes(user.role)) redirect("/portal");

  return (
    <main className="container section">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Commerce operations</p>
          <h1 className="mt-3 text-3xl font-semibold">Order management.</h1>
          <p className="mt-2 text-sm text-slate-400">Review customer purchases, fulfillment, and Stripe refunds.</p>
        </div>
        <Link href="/admin" className="btn-secondary">Back to control center</Link>
      </div>
      <div className="mt-8"><AdminOrders /></div>
    </main>
  );
}
