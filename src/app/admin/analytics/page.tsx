import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";
import { SectionHeading } from "@/components/section-heading";
export const dynamic="force-dynamic";
export default async function Analytics(){
 const user=await getCurrentUser();if(!user)redirect("/login");if(!["OWNER","ADMIN"].includes(user.role))redirect("/portal");
 const since=new Date();since.setMonth(since.getMonth()-5);since.setDate(1);since.setHours(0,0,0,0);
 const [paidOrders,allOrders,customers,products,projects,inquiries]=await Promise.all([
  prisma.order.findMany({where:{status:{in:["PAID","FULFILLED"]},createdAt:{gte:since}},select:{totalCents:true,currency:true,createdAt:true}}),
  prisma.order.count(),prisma.user.count({where:{role:"CLIENT"}}),prisma.product.count({where:{active:true}}),prisma.project.count(),prisma.inquiry.count()
 ]);
 const revenue=paidOrders.filter(o=>o.currency.toLowerCase()==="usd").reduce((sum,o)=>sum+o.totalCents,0);
 const monthLabels=Array.from({length:6},(_,i)=>{const d=new Date(since);d.setMonth(since.getMonth()+i);return {key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`,label:d.toLocaleString("en-US",{month:"short"})};});
 const monthly=monthLabels.map(m=>({...m,total:paidOrders.filter(o=>`${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth()+1).padStart(2,"0")}`===m.key&&o.currency.toLowerCase()==="usd").reduce((s,o)=>s+o.totalCents,0)}));
 const max=Math.max(1,...monthly.map(m=>m.total));
 return <main className="container section"><SectionHeading eyebrow="Owner intelligence" title="Business performance." description="A live operational snapshot based on recorded NEXCON data. Revenue totals and chart include USD orders only."/>
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[[ "Paid revenue",money(revenue),"All currencies summed as stored (review currency mix)" ],["Customers",String(customers),"Client accounts"],["Orders",String(allOrders),"All order states"],["Active products",String(products),"Published catalog items"]].map(([label,value,sub])=><div className="card p-5" key={label}><p className="text-sm text-slate-400">{label}</p><p className="mt-4 text-3xl font-semibold">{value}</p><p className="mt-2 text-xs text-slate-500">{sub}</p></div>)}</div>
 <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_.7fr]"><section className="card p-6"><h2 className="font-semibold">Paid revenue by month · USD</h2><div className="mt-8 flex h-52 items-end gap-3">{monthly.map(m=><div key={m.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><div className="flex w-full flex-1 items-end"><div title={money(m.total)} className="w-full rounded-t-md bg-gradient-to-t from-violet-600 to-cyan-300" style={{height:`${Math.max(m.total?5:0,m.total/max*100)}%`}}/></div><span className="text-xs text-slate-500">{m.label}</span></div>)}</div></section><section className="card p-6"><h2 className="font-semibold">Business pipeline</h2><div className="mt-6 space-y-5">{[["Projects",projects],["Open inquiries",inquiries],["Customer accounts",customers]].map(([label,value])=><div key={label}><div className="flex justify-between text-sm"><span className="text-slate-400">{label}</span><strong>{value}</strong></div><div className="mt-2 h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-violet-400" style={{width:`${Math.min(100,Number(value)*5)}%`}}/></div></div>)}</div></section></div>
 <p className="mt-4 text-xs leading-5 text-slate-500">Note: This is an operational dashboard, not audited financial reporting. Non-USD orders are excluded from these revenue figures.</p></main>;
}
