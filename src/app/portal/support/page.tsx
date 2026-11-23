import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SupportCenter } from "@/components/support-center";
export default async function SupportPage(){const user=await getCurrentUser();if(!user)redirect("/login");return <main className="container section"><p className="eyebrow">Client workspace</p><h1 className="mt-3 mb-3 text-3xl font-semibold">Support center.</h1><p className="mb-8 text-sm text-slate-400">Open a request and keep the conversation attached to your account.</p><SupportCenter/></main>}
