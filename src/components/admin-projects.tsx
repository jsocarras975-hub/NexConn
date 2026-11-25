"use client";
import { useEffect, useState } from "react";
import { ProjectTaskManager } from "@/components/project-task-manager";

type Project = { id: string; title: string; summary: string; status: string; progress: number; client: { name: string; email: string } };

export function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [quoteBusy, setQuoteBusy] = useState<string | null>(null);

  async function load() {
    const r = await fetch("/api/admin/projects");
    if (r.ok) { const d = await r.json(); setProjects(d.projects); }
  }
  useEffect(() => { void load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault(); setError(""); setNotice("");
    const r = await fetch("/api/admin/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, title, summary }) });
    const d = await r.json();
    if (!r.ok) { setError(d.error || "Create failed."); return; }
    setEmail(""); setTitle(""); setSummary(""); setNotice("Project created.");
    await load();
  }

  async function update(id: string, patch: Record<string, unknown>) {
    const r = await fetch(`/api/admin/projects/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const d = await r.json();
    if (!r.ok) { setError(d.error || "Update failed."); return; }
    await load();
  }

  // Project → Quote: creates a DRAFT invoice on the project (one line item)
  // and flips the project to QUOTED. Sending the quote is the existing
  // "mark sent" action on the invoice, which emails the customer.
  async function createQuote(p: Project) {
    const descEl = document.getElementById(`quote-desc-${p.id}`) as HTMLInputElement | null;
    const amountEl = document.getElementById(`quote-amount-${p.id}`) as HTMLInputElement | null;
    const description = descEl?.value.trim() || p.title;
    const dollars = Number(amountEl?.value);
    setError(""); setNotice("");
    if (!dollars || dollars <= 0) { setError("Enter a quote amount first."); return; }
    setQuoteBusy(p.id);
    try {
      const r = await fetch("/api/admin/conversions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "project-to-quote",
          projectId: p.id,
          items: [{ description, quantity: 1, unitPriceCents: Math.round(dollars * 100) }],
        }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Quote failed."); return; }
      setNotice(`Quote ${d.invoice.invoiceNumber} created as a draft invoice. Send it from Invoices when ready.`);
      await load();
    } finally {
      setQuoteBusy(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <form onSubmit={create} className="card h-fit p-6">
        <h2 className="text-lg font-semibold">Create a client project</h2>
        <label className="mt-4 block text-sm">Client account email<input className="input mt-2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="mt-4 block text-sm">Project title<input className="input mt-2" required minLength={3} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label className="mt-4 block text-sm">Project summary<textarea className="input mt-2" rows={4} required minLength={10} value={summary} onChange={(e) => setSummary(e.target.value)} /></label>
        <button className="btn-primary mt-5 w-full">Create project</button>
        {error && <p role="alert" className="mt-3 text-sm text-rose-300">{error}</p>}
        {notice && <p role="status" className="mt-3 text-sm text-emerald-300">{notice}</p>}
      </form>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">All projects</h2>
        {projects.map((p) => (
          <article key={p.id} className="card p-5">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <h3 className="font-semibold">{p.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{p.client.name} · {p.client.email}</p>
              </div>
              <span className="text-xs text-cyan-300">{p.status}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">{p.summary}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="text-xs text-slate-400">Progress <input aria-label="Project progress" type="number" min="0" max="100" defaultValue={p.progress} id={`progress-${p.id}`} className="input mt-1 w-20" /></label>
              <label className="text-xs text-slate-400">Status
                <select aria-label="Project status" id={`status-${p.id}`} defaultValue={p.status} className="input mt-1">
                  <option>INQUIRY</option><option>QUOTED</option><option>ACTIVE</option><option>REVIEW</option><option>COMPLETED</option><option>ON_HOLD</option>
                </select>
              </label>
              <button onClick={() => { const progress = Number((document.getElementById(`progress-${p.id}`) as HTMLInputElement).value); const status = (document.getElementById(`status-${p.id}`) as HTMLSelectElement).value; void update(p.id, { progress, status }); }} className="btn-secondary self-end">Save update</button>
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-white/5 pt-4">
              <label className="text-xs text-slate-400">Quote description<input aria-label="Quote description" id={`quote-desc-${p.id}`} defaultValue={p.title} className="input mt-1 w-56" /></label>
              <label className="text-xs text-slate-400">Amount (USD)<input aria-label="Quote amount in dollars" id={`quote-amount-${p.id}`} type="number" min="1" step="0.01" placeholder="1500" className="input mt-1 w-28" /></label>
              <button onClick={() => void createQuote(p)} disabled={quoteBusy === p.id} className="btn-secondary self-end">
                {quoteBusy === p.id ? "Creating…" : "Create quote →"}
              </button>
            </div>
            <ProjectTaskManager projectId={p.id} />
          </article>
        ))}
        {!projects.length && <div className="card p-8 text-sm text-slate-500">No projects created yet.</div>}
      </section>
    </div>
  );
}
