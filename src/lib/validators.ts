import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(254),
  password: z.string().min(12).max(128)
});
export const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(128)
});
export const inquirySchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254),
  company: z.string().max(120).optional(),
  service: z.string().trim().min(2).max(80),
  budget: z.string().max(80).optional(),
  timeline: z.string().max(80).optional(),
  details: z.string().trim().min(20).max(5000)
});
