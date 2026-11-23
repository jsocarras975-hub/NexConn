-- Store the verified Stripe settlement timestamp for paid marketplace orders.
ALTER TABLE "Order" ADD COLUMN "paidAt" TIMESTAMP(3);
CREATE INDEX "Order_paidAt_currency_idx" ON "Order"("paidAt", "currency");
