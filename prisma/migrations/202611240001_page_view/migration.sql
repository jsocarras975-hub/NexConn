-- First-party web traffic analytics.
-- PageView rows are written by /api/traffic/track (one per page view) and
-- read by the owner command center. No cookies, no personal data: the IP
-- is stored only as a SHA-256 hash so unique visitors can be counted
-- without keeping addresses.
CREATE TABLE "PageView" (
  "id" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "referrer" TEXT,
  "userAgent" TEXT,
  "country" TEXT,
  "ipHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PageView_createdAt_idx"
ON "PageView"("createdAt");

CREATE INDEX "PageView_path_createdAt_idx"
ON "PageView"("path", "createdAt");
