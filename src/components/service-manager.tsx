"use client";

import { useEffect, useState } from "react";

type ServiceRow = {
  id: string;
  slug: string;
  name: string;
  group: string;
  price: string;
  pitch: string;
  deliverables: string[];
  sort: number;
  active: boolean;
};

const GROUPS = ["Build", "Automate", "Host", "Amplify"];
const blank = { slug: "", name: "", group: "Build", price: "", pitch: "", deliverables: "" };

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function ServiceManager() {
  const [items, setItems] = useState<ServiceRow[]>([]);
  const [form, setForm] = useState(blank);
  const [slugTouched, setSlugTouched] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/admin/services", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load services.");
    setItems(data.services);
  }
  useEffect(() => { void load().catch((e) => setError(e instanceof Error ? e.message : "Could not load services.")); }, []);

  function update<K extends keyof typeof blank>(key: K, value: (typeof blank)[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "name" && !editing && !slugTouched) next.slug = slugify(String(value));
      return next;
    });
    if (key === "slug") setSlugTouched(true);
  }

  function edit(service: ServiceRow) {
    setEditing(service.id);
    setSlugTouched(true);
    setForm({
      slug: service.slug,
      name: service.name,
      group: service.group,
      price: service.price,
      pitch: service.pitch,
      deliverables: service.deliverables.join("\n"),
    });
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setEditing(null);
    setForm(blank);
    setSlugTouched(false);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const deliverables = form.deliverables.split("\n").map((d) => d.trim()).filter(Boolean);
    if (!deliverables.length) {
      setError("Add at least one deliverable (one per line).");
      setBusy(false);
      return;
    }
    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      group: form.group,
      price: form.price.trim(),
      pitch: form.pitch.trim(),
      deliverables,
    };
    try {
      const response = await fetch(editing ? `/api/admin/services/${editing}` : "/api/admin/services", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Service save failed.");
      setNotice(editing ? "Service saved." : "Service added to the catalog.");
      reset();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Service save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(service: ServiceRow) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !service.active }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Service update failed.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Service update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(service: ServiceRow) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/services/${service.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Service delete failed.");
      setNotice(`"${service.name}" deleted.`);
      setConfirmDeleteId(null);
      if (editing === service.id) reset();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Service delete failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
      <form onSubmit={save} className="card h-fit p-6">
        <h2 className="font-semibold">{editing ? "Edit service" : "Add a service"}</h2>
        <label className="mt-4 block text-sm">Service name
          <input className="input mt-2" value={form.name} onChange={(e) => update("name", e.target.value)} required />
        </label>
        <label className="mt-4 block text-sm">URL slug
          <input className="input mt-2" value={form.slug} onChange={(e) => update("slug", e.target.value)} required placeholder="native-android-app-development" />
        </label>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block text-sm">Group
            <select className="input mt-2 w-full" value={form.group} onChange={(e) => update("group", e.target.value)}>
              {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>
          <label className="block text-sm">Price (as shown)
            <input className="input mt-2" value={form.price} onChange={(e) => update("price", e.target.value)} required placeholder="$300 or $19.99/mo" />
          </label>
        </div>
        <label className="mt-4 block text-sm">Pitch
          <textarea className="input mt-2" rows={4} value={form.pitch} onChange={(e) => update("pitch", e.target.value)} required minLength={10} />
        </label>
        <label className="mt-4 block text-sm">Deliverables (one per line)
          <textarea className="input mt-2" rows={6} value={form.deliverables} onChange={(e) => update("deliverables", e.target.value)} required />
        </label>
        <div className="mt-5 flex flex-wrap gap-2">
          <button className="btn-primary flex-1" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Add service"}</button>
          {editing && <button type="button" className="btn-secondary" onClick={reset}>Cancel</button>}
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-rose-300">{error}</p>}
        {notice && <p role="status" className="mt-3 text-sm text-emerald-300">{notice}</p>}
        <p className="mt-3 text-xs leading-5 text-slate-500">Prices are final prices, shown exactly as typed — never add “starting at”. Changes go live on the site immediately.</p>
      </form>

      <section className="space-y-3">
        <h2 className="font-semibold">Service catalog</h2>
        {items.map((service) => (
          <article key={service.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="min-w-0">
              <p className="font-semibold">{service.name}</p>
              <p className="mt-1 break-all text-xs text-slate-500">/services/{service.slug} · {service.group} · {service.price}</p>
              <p className={`mt-1 text-[11px] ${service.active ? "text-emerald-300" : "text-slate-500"}`}>{service.active ? "Live on the site" : "Hidden (deactivated)"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => edit(service)} className="btn-secondary" disabled={busy}>Edit</button>
              <button type="button" onClick={() => void toggle(service)} className="btn-secondary" disabled={busy}>{service.active ? "Deactivate" : "Activate"}</button>
              {confirmDeleteId === service.id ? (
                <>
                  <button type="button" onClick={() => void remove(service)} className="btn-secondary font-semibold text-rose-300" disabled={busy}>{busy ? "Deleting…" : "Confirm delete"}</button>
                  <button type="button" onClick={() => setConfirmDeleteId(null)} className="btn-secondary" disabled={busy}>Cancel</button>
                </>
              ) : (
                <button type="button" onClick={() => setConfirmDeleteId(service.id)} className="btn-secondary text-rose-300" disabled={busy}>Delete</button>
              )}
            </div>
          </article>
        ))}
        {!items.length && <div className="card p-8 text-sm text-slate-500">No services in the database yet.</div>}
        <p className="text-xs leading-6 text-slate-500">The two hosting services are tied to Stripe subscription plans, so they can be edited or deactivated but not deleted. Deactivating any service hides it from the site right away; its page stops working until it is reactivated.</p>
      </section>
    </div>
  );
}
