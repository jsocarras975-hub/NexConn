import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";
import { InvoicePayButton } from "@/components/invoice-pay-button";

export const dynamic = "force-dynamic";

export default async function InvoiceDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ payment?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const query = await searchParams;
  const invoice = await prisma.invoice.findFirst({
    where: { id, ...(["OWNER", "ADMIN"].includes(user.role) ? {} : { userId: user.id }) },
    include: { user: { select: { name: true, email: true } }, items: true, project: { select: { title: true } } },
  });
  if (!invoice) notFound();

  return (
    <main className="container section">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/portal/invoices" className="btn-secondary">← Back to invoices</Link>
        <div className="flex gap-2">{invoice.status !== "PAID" && invoice.status !== "VOID" && ["SENT", "OVERDUE"].includes(invoice.status) && <InvoicePayButton invoiceId={invoice.id}/>}<button type="button" onClick={() => window.print()} className="btn-primary">Print / Save PDF</button></div>
      </div>
      {query.payment === "success" && invoice.status !== "PAID" && <p className="no-print mb-4 text-sm text-amber-300">Payment submitted. Invoice status updates after Stripe confirms payment.</p>}
      {query.payment === "cancelled" && <p className="no-print mb-4 text-sm text-slate-400">Checkout was cancelled. No payment was recorded.</p>}
      <article className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-slate-900 shadow-xl print:rounded-none print:p-0 print:shadow-none sm:p-12">
        <div className="flex flex-wrap justify-between gap-8 border-b border-slate-200 pb-8">
          <div><p className="text-sm font-semibold tracking-[0.2em] text-cyan-700">N3xUs Konc3pt'z</p><h1 className="mt-3 text-3xl font-bold">INVOICE</h1><p className="mt-2 text-sm text-slate-500">{invoice.invoiceNumber}</p></div>
          <div className="text-right"><p className="text-sm font-semibold">{invoice.status}</p><p className="mt-2 text-sm text-slate-500">Issued {invoice.createdAt.toLocaleDateString()}</p>{invoice.dueAt && <p className="mt-1 text-sm text-slate-500">Due {invoice.dueAt.toLocaleDateString()}</p>}</div>
        </div>
        <div className="grid gap-8 py-8 sm:grid-cols-2">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Billed to</p><p className="mt-2 font-semibold">{invoice.user.name}</p><p className="text-sm text-slate-600">{invoice.user.email}</p></div>
          {invoice.project && <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Project</p><p className="mt-2 font-semibold">{invoice.project.title}</p></div>}
        </div>
        <table className="w-full border-collapse text-left text-sm">
          <thead><tr className="border-y border-slate-200 text-xs uppercase text-slate-500"><th className="py-3">Description</th><th className="py-3 text-right">Qty</th><th className="py-3 text-right">Unit price</th><th className="py-3 text-right">Total</th></tr></thead>
          <tbody>{invoice.items.map(item => <tr key={item.id} className="border-b border-slate-100"><td className="py-4">{item.description}</td><td className="py-4 text-right">{item.quantity}</td><td className="py-4 text-right">{money(item.unitPriceCents, invoice.currency)}</td><td className="py-4 text-right">{money(item.quantity * item.unitPriceCents, invoice.currency)}</td></tr>)}</tbody>
        </table>
        <div className="ml-auto mt-6 max-w-xs border-t border-slate-200 pt-4"><div className="flex justify-between text-lg font-bold"><span>Total due</span><span>{money(invoice.totalCents, invoice.currency)}</span></div>{invoice.paidAt && <p className="mt-2 text-right text-sm text-emerald-700">Paid {invoice.paidAt.toLocaleDateString()}</p>}</div>
        {invoice.notes && <div className="mt-10 border-t border-slate-200 pt-6"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Notes</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{invoice.notes}</p></div>}
        <p className="mt-12 border-t border-slate-200 pt-5 text-xs text-slate-500">Thank you for your business.</p>
      </article>
    </main>
  );
}
