import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminProjects } from "@/components/admin-projects";
export default async function AdminProjectsPage(){const user=await getCurrentUser();if(!user)redirect("/login");if(!["OWNER","ADMIN"].includes(user.role))redirect("/portal");return <main className="container section"><p className="eyebrow">Owner console</p><h1 className="mt-3 mb-3 text-3xl font-semibold">Project operations.</h1><p className="mb-8 text-sm text-slate-400">Create client projects and keep progress visible.</p><AdminProjects/></main>}
