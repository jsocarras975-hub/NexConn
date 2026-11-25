-- H3 (code audit 2026-11-25): invoice refunds were not reconciled — the
-- webhook only matched charge.refunded to orders. Track refunded cents on
-- invoices and allow a REFUNDED status, mirroring the Order model.
-- (ALTER TYPE ... ADD VALUE cannot run inside a transaction, so use the
-- create-new-type / swap pattern Prisma generates for enum changes.)
-- NOTE: the status column has a DEFAULT ('DRAFT') — Postgres refuses the
-- type change unless the default is dropped first and re-added after.
CREATE TYPE "InvoiceStatus_new" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'VOID', 'REFUNDED');
ALTER TABLE "Invoice" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Invoice" ALTER COLUMN "status" TYPE "InvoiceStatus_new" USING ("status"::text::"InvoiceStatus_new");
ALTER TABLE "Invoice" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
ALTER TYPE "InvoiceStatus" RENAME TO "InvoiceStatus_old";
ALTER TYPE "InvoiceStatus_new" RENAME TO "InvoiceStatus";
DROP TYPE "InvoiceStatus_old";
ALTER TABLE "Invoice" ADD COLUMN "refundedCents" INTEGER NOT NULL DEFAULT 0;
