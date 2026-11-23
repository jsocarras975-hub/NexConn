ALTER TABLE "Invoice"
  ADD COLUMN "stripeCheckoutSession" TEXT,
  ADD COLUMN "stripePaymentIntent" TEXT;
CREATE UNIQUE INDEX "Invoice_stripeCheckoutSession_key" ON "Invoice"("stripeCheckoutSession");
CREATE UNIQUE INDEX "Invoice_stripePaymentIntent_key" ON "Invoice"("stripePaymentIntent");
