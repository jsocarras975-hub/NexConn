-- H2 (code audit 2026-11-25): downloadUrl was dead weight — attach-file wrote
-- downloadKey and set downloadUrl to null, while every consumer required both
-- fields non-null, so attached files were invisible to customers and to the
-- admin. Downloads are keyed on downloadKey only now.
ALTER TABLE "Product" DROP COLUMN "downloadUrl";

-- Products with no attached file must not be sold: the store promises instant
-- download, so a customer could pay for nothing. Deactivate them until a file
-- is attached (attaching a file does not re-activate; the owner flips active).
UPDATE "Product" SET "active" = false WHERE "downloadKey" IS NULL;
