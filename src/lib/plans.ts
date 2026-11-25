import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

// Subscription plans for the two hosting services. The Stripe prices live on
// the existing Stripe products ("Premium Web Hosting" / "Premium Bot
// Hosting"); the amounts match the catalog prices on the services pages.
export type Plan = {
  slug: string;
  name: string;
  serviceSlug: string;
  stripePriceId: string;
  priceCents: number;
  currency: string;
  interval: string;
};

export const PLANS: Plan[] = [
  {
    slug: "cloud-hosting",
    name: "Managed Cloud Hosting",
    serviceSlug: "premium-managed-cloud-hosting",
    stripePriceId: "price_1UfcBlGWolWdiG7Qq1YM3Gxw",
    priceCents: 1999,
    currency: "usd",
    interval: "month",
  },
  {
    slug: "bot-hosting",
    name: "Managed Bot Hosting",
    serviceSlug: "premium-managed-bot-hosting",
    stripePriceId: "price_1Th9CSGWolWdiG7QXkVLcr5u",
    priceCents: 999,
    currency: "usd",
    interval: "month",
  },
];

export function getPlan(slug: string): Plan | null {
  return PLANS.find((plan) => plan.slug === slug) ?? null;
}

export function getPlanByServiceSlug(serviceSlug: string): Plan | null {
  return PLANS.find((plan) => plan.serviceSlug === serviceSlug) ?? null;
}

// Every subscription and portal flow needs a Stripe customer for the user.
// Create it once and remember the id on the account.
export async function getOrCreateStripeCustomer(
  stripe: Stripe,
  user: { id: string; email: string; name: string; stripeCustomerId: string | null },
): Promise<string> {
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId: user.id },
  });
  await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}
