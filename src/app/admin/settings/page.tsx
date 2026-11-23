import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SettingsEditor } from "@/components/settings-editor";
export default async function AdminSettings(){const u=await getCurrentUser();if(!u)redirect("/login");if(!["OWNER","ADMIN"].includes(u.role))redirect("/portal");return <main className="container section"><p className="eyebrow">Platform configuration</p><h1 className="mt-3 mb-3 text-3xl font-semibold">Business settings.</h1><p className="mb-8 text-sm text-slate-400">Manage a small set of non-secret business settings. Never store API keys or passwords here.</p><SettingsEditor/></main>}
