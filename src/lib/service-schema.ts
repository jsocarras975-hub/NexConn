import { z } from "zod";

// Shared validation for the admin service-catalog API (create + update).
export const serviceSchema = z.object({
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and dashes."),
  name: z.string().trim().min(2).max(140),
  group: z.enum(["Build", "Automate", "Host", "Amplify"]),
  price: z.string().trim().min(1).max(24),
  pitch: z.string().trim().min(10).max(800),
  deliverables: z.array(z.string().trim().min(1).max(160)).min(1).max(12),
  sort: z.number().int().min(0).max(9999).optional(),
  active: z.boolean().optional(),
});
