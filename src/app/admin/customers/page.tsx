import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic="force-dynamic";
export default async function Customers(){
 const user=await getCurrentUser();if(!user)redirect("/login");if(!["OWNER","ADMIN"].includes(user.role))redirect("/portal");
 const clients=await prisma.user.findMany({where:{role:"CLIENT"},orderBy:{createdAt:"desc"},take:250,include:{_count:{select:{orders:true,projects:true,tickets:true}}}});
 return <main className="container section"><p className="eyebrow">Customer relationship management</p><h1 className="mt-3 text-3xl font-semibold">Customers.</h1><p className="mt-2 mb-8 text-sm text-slate-400">Client accounts and their relationship activity.</p><div className="card overflow-hidden"><div className="grid grid-cols-[1.3fr_1fr_.6fr_.6fr_.6fr] gap-3 border-b border-white/10 p-4 text-xs uppercase tracking-wider text-slate-500"><span>Customer</span><span>Joined</span><span>Orders</span><span>Projects</span><span>Tickets</span></div>{clients.map(c=><div key={c.id} className="grid grid-cols-[1.3fr_1fr_.6fr_.6fr_.6fr] gap-3 border-b border-white/5 p-4 text-sm last:border-0"><div className="min-w-0"><p className="truncate font-medium">{c.name}</p><p className="truncate text-xs text-slate-500">{c.email}</p></div><span className="text-xs text-slate-400">{c.createdAt.toLocaleDateString()}</span><span>{c._count.orders}</span><span>{c._count.projects}</span><span>{c._count.tickets}</span></div>)}{!clients.length&&<p className="p-8 text-sm text-slate-500">No client accounts yet.</p>}</div></main>;
}
