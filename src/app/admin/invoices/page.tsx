import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { InvoiceManager } from "@/components/invoice-manager";
export default async function AdminInvoices(){const u=await getCurrentUser();if(!u)redirect("/login");if(!["OWNER","ADMIN"].includes(u.role))redirect("/portal");return <main className="container section"><p className="eyebrow">Finance operations</p><h1 className="mt-3 mb-3 text-3xl font-semibold">Invoices.</h1><p className="mb-8 text-sm text-slate-400">Create draft invoice records and review customer billing history. Sending, payment collection, PDF rendering, and reminders require additional configuration.</p><InvoiceManager/></main>}
