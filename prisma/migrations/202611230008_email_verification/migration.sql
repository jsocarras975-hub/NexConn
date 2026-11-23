-- v14.4 launch hardening: email verification.
-- Adds emailVerified to User, a hashed single-use verification token table,
-- and backfills existing accounts as verified so nobody who already has an
-- account is locked out by this upgrade.
ALTER TABLE "User"
ADD COLUMN "emailVerified" TIMESTAMP(3);

CREATE TABLE "EmailVerificationToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key"
ON "EmailVerificationToken"("tokenHash");

CREATE INDEX "EmailVerificationToken_userId_idx"
ON "EmailVerificationToken"("userId");

ALTER TABLE "EmailVerificationToken"
ADD CONSTRAINT "EmailVerificationToken_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Accounts created before email verification existed are grandfathered in.
UPDATE "User" SET "emailVerified" = CURRENT_TIMESTAMP WHERE "emailVerified" IS NULL;
