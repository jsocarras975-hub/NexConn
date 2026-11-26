import { ServiceManager } from "@/components/service-manager";

export const dynamic = "force-dynamic";

export default function AdminServicesPage() {
  return (
    <main className="container section">
      <p className="eyebrow">Admin</p>
      <h1 className="mt-3 text-3xl font-semibold">Services</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        The public service catalog. Add, edit, deactivate, or delete services — changes show on the
        homepage, the services pages, and the sitemap right away.
      </p>
      <div className="mt-8">
        <ServiceManager />
      </div>
    </main>
  );
}
