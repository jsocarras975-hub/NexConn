-- Track cumulative refund amounts and individual Stripe refund records.
ALTER TABLE "Order" ADD COLUMN "refundedCents" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "StripeRefund" (
  "id" TEXT NOT NULL,
  "stripeRefundId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StripeRefund_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StripeRefund_stripeRefundId_key" ON "StripeRefund"("stripeRefundId");
CREATE INDEX "StripeRefund_orderId_createdAt_idx" ON "StripeRefund"("orderId", "createdAt");
ALTER TABLE "StripeRefund" ADD CONSTRAINT "StripeRefund_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
