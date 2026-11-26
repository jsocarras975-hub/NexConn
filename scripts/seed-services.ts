// Seeds the Service table from the static SERVICES catalog in
// src/data/studio.ts. Idempotent and non-destructive: it only inserts
// services whose slug is not already in the table, so re-running it
// never overwrites edits the owner made in the admin panel.
//
// Run once when the service catalog migration deploys:
//   npx tsx scripts/seed-services.ts
import { PrismaClient } from "@prisma/client";
import { SERVICES } from "../src/data/studio";

const prisma = new PrismaClient();

async function main() {
  let created = 0;
  for (const [index, service] of SERVICES.entries()) {
    const existing = await prisma.service.findUnique({ where: { slug: service.slug }, select: { id: true } });
    if (existing) continue;
    await prisma.service.create({
      data: {
        slug: service.slug,
        name: service.name,
        group: service.group,
        price: service.price,
        pitch: service.pitch,
        deliverables: service.deliverables,
        sort: index,
        active: true,
      },
    });
    created += 1;
  }
  console.log(`Service catalog seed: ${created} created, ${SERVICES.length - created} already present.`);
}

main()
  .catch((error) => {
    console.error("Service catalog seed failed", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
