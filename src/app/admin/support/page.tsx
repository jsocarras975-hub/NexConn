import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminSupport } from "@/components/admin-support";
export default async function AdminSupportPage(){const user=await getCurrentUser();if(!user)redirect("/login");if(!["OWNER","ADMIN"].includes(user.role))redirect("/portal");return <main className="container section"><p className="eyebrow">Owner console</p><h1 className="mt-3 mb-3 text-3xl font-semibold">Support inbox.</h1><p className="mb-8 text-sm text-slate-400">Review customer requests and respond from the owner console.</p><AdminSupport/></main>}
