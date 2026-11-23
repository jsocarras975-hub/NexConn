import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ProductManager } from "@/components/product-manager";
export default async function AdminProducts(){const u=await getCurrentUser();if(!u)redirect("/login");if(!["OWNER","ADMIN"].includes(u.role))redirect("/portal");return <main className="container section"><p className="eyebrow">Marketplace operations</p><h1 className="mt-3 mb-3 text-3xl font-semibold">Product catalog.</h1><p className="mb-8 text-sm text-slate-400">Create drafts and control publication. Upload private files directly to your S3-compatible bucket, then store the object key here after adding an admin editor.</p><ProductManager/></main>}
