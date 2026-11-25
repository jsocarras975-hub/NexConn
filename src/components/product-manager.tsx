"use client";

import { useEffect, useState } from "react";

type Product = {
  id: string; slug: string; name: string; summary: string; description: string;
  category: string; priceCents: number; currency: string; imageUrl: string | null;
  active: boolean; featured: boolean; hasPrivateFile: boolean;
};

const blank = { slug: "", name: "", summary: "", description: "", category: "Digital tools", price: "49.99", imageUrl: "" };

export function ProductManager() {
  const [items, setItems] = useState<Product[]>([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/admin/products", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load products.");
    setItems(data.products);
  }
  useEffect(() => { void load().catch((e) => setError(e instanceof Error ? e.message : "Could not load products.")); }, []);

  function update<K extends keyof typeof blank>(key: K, value: (typeof blank)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  function edit(product: Product) {
    setEditing(product.id);
    setForm({ slug: product.slug, name: product.name, summary: product.summary, description: product.description, category: product.category, price: (product.priceCents / 100).toFixed(2), imageUrl: product.imageUrl || "" });
    setError(""); setNotice(""); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function reset() { setEditing(null); setForm(blank); }

  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    const cents = Math.round(Number(form.price) * 100);
    if (!Number.isFinite(cents) || cents < 0) { setError("Enter a valid non-negative price."); setBusy(false); return; }
    const payload = { slug: form.slug.trim(), name: form.name.trim(), summary: form.summary.trim(), description: form.description.trim(), category: form.category.trim(), priceCents: cents, currency: "usd", imageUrl: form.imageUrl.trim() || null };
    try {
      const response = await fetch(editing ? `/api/admin/products/${editing}` : "/api/admin/products", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing ? payload : { ...payload, active: false, featured: false }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Product save failed.");
      setNotice(editing ? "Product details saved." : "Draft product created."); reset(); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Product save failed."); }
    finally { setBusy(false); }
  }

  async function toggle(product: Product, field: "active" | "featured") {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: !product[field] }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Product update failed.");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Product update failed."); }
    finally { setBusy(false); }
  }

  async function uploadFile(product: Product, file?: File) {
    if (!file) return;
    setUploading(product.id); setError(""); setNotice("");
    try {
      const allowed = new Set(["application/pdf", "application/zip", "application/x-zip-compressed", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);
      if (!allowed.has(file.type)) throw new Error("Supported formats: PDF, ZIP, DOCX, or XLSX.");
      if (file.size < 1 || file.size > 100 * 1024 * 1024) throw new Error("File must be between 1 byte and 100 MB.");

      const signedResponse = await fetch(`/api/admin/products/${product.id}/upload-url`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, contentLength: file.size }),
      });
      const signed = await signedResponse.json();
      if (!signedResponse.ok) throw new Error(signed.error || "Could not prepare upload.");

      const putResponse = await fetch(signed.uploadUrl, {
        method: "PUT", headers: signed.requiredHeaders, body: file,
      });
      if (!putResponse.ok) throw new Error("Storage upload failed. Check the bucket CORS settings and try again.");

      const attachResponse = await fetch(`/api/admin/products/${product.id}/attach-file`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectKey: signed.objectKey }),
      });
      const attached = await attachResponse.json();
      if (!attachResponse.ok) throw new Error(attached.error || "Could not attach uploaded file.");

      setNotice(`Private file attached to ${product.name}.`);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Upload failed."); }
    finally { setUploading(null); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
      <form onSubmit={save} className="card h-fit p-6">
        <h2 className="font-semibold">{editing ? "Edit product" : "Create product draft"}</h2>
        {([
          ["slug", "URL slug"], ["name", "Product name"], ["summary", "Short summary"],
          ["category", "Category"], ["price", "Price in USD"], ["imageUrl", "Product image URL (optional)"],
        ] as const).map(([key, label]) => (
          <label key={key} className="mt-4 block text-sm">{label}
            <input className="input mt-2" value={form[key]} onChange={(event) => update(key, event.target.value)} required={key !== "imageUrl"} type={key === "price" ? "number" : "text"} min={key === "price" ? "0" : undefined} step={key === "price" ? "0.01" : undefined}/>
          </label>
        ))}
        <label className="mt-4 block text-sm">Description
          <textarea className="input mt-2" rows={5} value={form.description} onChange={(event) => update("description", event.target.value)} required minLength={10}/>
        </label>
        <div className="mt-5 flex flex-wrap gap-2">
          <button className="btn-primary flex-1" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Create draft"}</button>
          {editing && <button type="button" className="btn-secondary" onClick={reset}>Cancel</button>}
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-rose-300">{error}</p>}
        {notice && <p role="status" className="mt-3 text-sm text-emerald-300">{notice}</p>}
      </form>

      <section className="space-y-3">
        <h2 className="font-semibold">Product catalog</h2>
        {items.map((product) => (
          <article key={product.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex min-w-0 items-center gap-3">
              {product.imageUrl ? <img src={product.imageUrl} alt="" className="h-14 w-14 rounded-xl object-cover"/> : <div className="grid h-14 w-14 place-items-center rounded-xl bg-white/[0.04] text-xl text-cyan-300">◇</div>}
              <div className="min-w-0">
                <p className="font-semibold">{product.name}</p>
                <p className="mt-1 break-all text-xs text-slate-500">/{product.slug} · {(product.priceCents / 100).toFixed(2)} {product.currency.toUpperCase()}</p>
                <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                  <span className={product.active ? "text-emerald-300" : "text-slate-500"}>{product.active ? "Published" : "Draft"}</span>
                  {product.featured && <span className="text-cyan-300">Featured</span>}
                  <span className={product.hasPrivateFile ? "text-cyan-300" : "text-slate-500"}>{product.hasPrivateFile ? "Private file attached" : "No private file"}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => edit(product)} className="btn-secondary" disabled={busy || !!uploading}>Edit</button>
              <button type="button" onClick={() => void toggle(product, "featured")} className="btn-secondary" disabled={busy || !!uploading}>{product.featured ? "Unfeature" : "Feature"}</button>
              <button type="button" onClick={() => void toggle(product, "active")} className="btn-secondary" disabled={busy || !!uploading}>{product.active ? "Unpublish" : "Publish"}</button>
              <label className="btn-secondary cursor-pointer">
                {uploading === product.id ? "Uploading…" : "Attach file"}
                <input className="sr-only" type="file" accept=".pdf,.zip,.docx,.xlsx,.bin" disabled={busy || !!uploading} onChange={(event) => { void uploadFile(product, event.target.files?.[0]); event.currentTarget.value = ""; }}/>
              </label>
            </div>
          </article>
        ))}
        {!items.length && <div className="card p-8 text-sm text-slate-500">No products yet.</div>}
        <p className="text-xs leading-6 text-slate-500">Private files are uploaded directly to your S3-compatible bucket using a five-minute signed URL. Maximum file size: 100 MB. Configure bucket CORS before testing browser uploads.</p>
      </section>
    </div>
  );
}
