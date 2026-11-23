import { z } from "zod";

// Turnstile token submitted by the client forms. Optional in the schema so
// local development without Turnstile keys keeps working; the server-side
// verifyCaptcha call decides whether a missing token is acceptable.
const captchaToken = z.string().min(1).max(2048).optional();

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(254),
  password: z.string().min(12).max(128),
  captchaToken,
});
export const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(128),
  captchaToken,
});
export const inquirySchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254),
  company: z.string().max(120).optional(),
  service: z.string().trim().min(2).max(80),
  budget: z.string().max(80).optional(),
  timeline: z.string().max(80).optional(),
  details: z.string().trim().min(20).max(5000),
  captchaToken,
});
export const passwordResetRequestSchema = z.object({
  email: z.email().max(254),
  captchaToken,
});
export const passwordResetConfirmSchema = z.object({
  token: z.string().min(32).max(256),
  password: z.string().min(12).max(128),
});
export const verifyEmailResendSchema = z.object({
  email: z.email().max(254),
});
