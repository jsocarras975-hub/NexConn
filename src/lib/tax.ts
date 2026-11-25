// Stripe Tax is opt-in via STRIPE_TAX_ENABLED=true. It stays off until the
// Stripe account has Stripe Tax activated and at least one tax
// registration — without those, Stripe cannot compute tax and checkout
// would misbehave. When on, checkout sessions ask Stripe to compute tax
// (prices are treated as tax-exclusive) and the webhook records the
// computed amount into taxCents on the order/invoice.
export function stripeTaxEnabled(): boolean {
  return process.env.STRIPE_TAX_ENABLED === "true";
}

export function automaticTaxParams(): { automatic_tax?: { enabled: boolean } } {
  return stripeTaxEnabled() ? { automatic_tax: { enabled: true } } : {};
}
