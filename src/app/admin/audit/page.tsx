import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Read-only viewer for the audit trail the app already writes (logins,
// settlements, refunds, disputes, admin changes, reminders). Filter by
// action or target with the query string, e.g. /admin/audit?action=ORDER.
export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; target?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["OWNER", "ADMIN"].includes(user.role)) redirect("/portal");

  const { action, target } = await searchParams;
  const entries = await prisma.auditLog.findMany({
    where: {
      ...(action ? { action: { contains: action.toUpperCase(), mode: "insensitive" as const } } : {}),
      ...(target ? { target: { contains: target } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: { select: { name: true, email: true } } },
  });

  return (
    <main className="container section">
      <p className="eyebrow">Administration</p>
      <h1 className="mt-3 text-3xl font-semibold">Audit log.</h1>
      <p className="mt-2 mb-8 text-sm text-slate-400">
        The latest 200 entries. Security and money events are recorded here automatically — logins, payments,
        refunds, disputes, account changes and reminders.
      </p>

      <form method="get" className="mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          name="action"
          defaultValue={action ?? ""}
          placeholder="Filter by action, e.g. ORDER"
          className="rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm"
        />
        <input
          type="text"
          name="target"
          defaultValue={target ?? ""}
          placeholder="Filter by target id"
          className="rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm"
        />
        <button type="submit" className="btn-secondary px-4 py-2 text-sm">Filter</button>
      </form>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-[1fr_1.2fr_1.4fr_1fr] gap-3 border-b border-white/10 p-4 text-xs uppercase tracking-wider text-slate-500 max-lg:hidden">
          <span>When</span>
          <span>Action</span>
          <span>Target / details</span>
          <span>Actor</span>
        </div>
        {entries.map((entry) => (
          <div key={entry.id} className="grid grid-cols-[1fr_1.2fr_1.4fr_1fr] gap-3 border-b border-white/5 p-4 text-sm last:border-0 max-lg:grid-cols-1">
            <span className="text-xs text-slate-400">
              {entry.createdAt.toLocaleDateString()} {entry.createdAt.toLocaleTimeString()}
            </span>
            <span className="font-mono text-xs">{entry.action}</span>
            <div className="min-w-0">
              {entry.target && <p className="truncate font-mono text-xs text-slate-400">{entry.target}</p>}
              {entry.metadata != null && (
                <p className="mt-1 break-all font-mono text-xs text-slate-500">
                  {JSON.stringify(entry.metadata)}
                </p>
              )}
            </div>
            <span className="text-xs text-slate-400">
              {entry.actor ? `${entry.actor.name} (${entry.actor.email})` : entry.ipAddress ? `IP ${entry.ipAddress}` : "System"}
            </span>
          </div>
        ))}
        {!entries.length && <p className="p-8 text-sm text-slate-500">No audit entries match.</p>}
      </div>
    </main>
  );
}
