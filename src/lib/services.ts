// The public service catalog, read from the database (Service table,
// managed in the admin panel) with the static SERVICES array from
// src/data/studio.ts as the fallback. The fallback matters twice over:
// local development has no database, and a catalog outage must never
// take the marketing pages down with it.
import { prisma } from "@/lib/prisma";
import { SERVICES, type Service } from "@/data/studio";

export async function getServices(): Promise<Service[]> {
  try {
    const rows = await prisma.service.findMany({
      where: { active: true },
      orderBy: [{ sort: "asc" }, { name: "asc" }],
    });
    if (!rows.length) return SERVICES;
    return rows.map((row) => ({
      slug: row.slug,
      name: row.name,
      group: row.group as Service["group"],
      price: row.price,
      pitch: row.pitch,
      deliverables: row.deliverables,
    }));
  } catch {
    return SERVICES;
  }
}

export async function getServiceBySlug(slug: string): Promise<Service | undefined> {
  const services = await getServices();
  return services.find((s) => s.slug === slug);
}
