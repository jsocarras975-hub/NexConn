import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ConvertInquiryButton } from "@/components/convert-inquiry-button";

export const dynamic = "force-dynamic";

export default async function Inquiries() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["OWNER", "ADMIN"].includes(user.role)) redirect("/portal");

  const items = await prisma.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  // Which inquiries already have a matching pipeline lead (same rule the
  // conversion uses: email + name + WEBSITE source).
  const leads = items.length
    ? await prisma.crmLead.findMany({
        where: { source: "WEBSITE", email: { in: items.map((i) => i.email) } },
        select: { email: true, name: true },
      })
    : [];
  const leadKeys = new Set(leads.map((l) => `${l.email}::${l.name}`));

  return (
    <main className="container section">
      <p className="eyebrow">Owner console</p>
      <h1 className="mt-3 text-3xl font-semibold">Project inquiries</h1>
      <div className="mt-8 grid gap-4">
        {items.map((i) => (
          <article key={i.id} className="card p-6">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h2 className="font-semibold">{i.name} · {i.service}</h2>
                <p className="mt-1 text-xs text-cyan-300">{i.email}</p>
              </div>
              <time className="text-xs text-slate-500">{i.createdAt.toLocaleString()}</time>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-300">{i.details}</p>
            <p className="mt-3 text-xs text-slate-500">
              Budget: {i.budget || "Not supplied"} · Timeline: {i.timeline || "Not supplied"} · Company: {i.company || "Not supplied"}
            </p>
            <div className="mt-4">
              <ConvertInquiryButton inquiryId={i.id} alreadyLead={leadKeys.has(`${i.email}::${i.name}`)} />
            </div>
          </article>
        ))}
        {!items.length && <div className="card p-8 text-sm text-slate-400">No inquiries received yet.</div>}
      </div>
    </main>
  );
}
