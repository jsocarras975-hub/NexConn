-- M6 (code audit 2026-11-25): migration 202611230005 added paidAt without
-- backfilling it, so older paid orders vanished from revenue views (the
-- analytics and command center filter on paidAt). Set paidAt from updatedAt
-- for orders that were already paid, fulfilled, or refunded.
UPDATE "Order" SET "paidAt" = "updatedAt" WHERE "status" IN ('PAID', 'FULFILLED', 'REFUNDED') AND "paidAt" IS NULL;
