import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { InvoiceList } from "@/components/invoice-list";
export default async function PortalInvoices(){const u=await getCurrentUser();if(!u)redirect("/login");return <main className="container section"><p className="eyebrow">Client workspace</p><h1 className="mt-3 mb-8 text-3xl font-semibold">Your invoices.</h1><InvoiceList/></main>}
