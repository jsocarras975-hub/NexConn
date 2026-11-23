-- Persistent CRM leads, tasks, notes and communication history.
CREATE TABLE "CrmLead" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "email" TEXT, "company" TEXT, "phone" TEXT,
  "source" TEXT NOT NULL DEFAULT 'OTHER', "stage" TEXT NOT NULL DEFAULT 'NEW',
  "estimatedValueCents" INTEGER, "currency" TEXT NOT NULL DEFAULT 'USD',
  "customerId" TEXT, "assignedToId" TEXT, "createdById" TEXT NOT NULL,
  "nextFollowUpAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CrmLead_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CrmLead_stage_updatedAt_idx" ON "CrmLead"("stage","updatedAt");
CREATE INDEX "CrmLead_customerId_idx" ON "CrmLead"("customerId");
CREATE INDEX "CrmLead_assignedToId_nextFollowUpAt_idx" ON "CrmLead"("assignedToId","nextFollowUpAt");

CREATE TABLE "CrmTask" (
  "id" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN', "priority" TEXT NOT NULL DEFAULT 'NORMAL',
  "dueAt" TIMESTAMP(3), "customerId" TEXT, "leadId" TEXT, "assignedToId" TEXT,
  "createdById" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CrmTask_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CrmTask_status_dueAt_idx" ON "CrmTask"("status","dueAt");
CREATE INDEX "CrmTask_customerId_idx" ON "CrmTask"("customerId");
CREATE INDEX "CrmTask_leadId_idx" ON "CrmTask"("leadId");

CREATE TABLE "CrmNote" (
  "id" TEXT NOT NULL, "body" TEXT NOT NULL, "customerId" TEXT, "leadId" TEXT,
  "authorId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CrmNote_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CrmNote_customerId_createdAt_idx" ON "CrmNote"("customerId","createdAt");
CREATE INDEX "CrmNote_leadId_createdAt_idx" ON "CrmNote"("leadId","createdAt");

CREATE TABLE "CrmCommunication" (
  "id" TEXT NOT NULL, "channel" TEXT NOT NULL, "direction" TEXT NOT NULL DEFAULT 'OUTBOUND',
  "subject" TEXT, "summary" TEXT NOT NULL, "customerId" TEXT, "leadId" TEXT,
  "authorId" TEXT NOT NULL, "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CrmCommunication_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CrmCommunication_customerId_occurredAt_idx" ON "CrmCommunication"("customerId","occurredAt");
CREATE INDEX "CrmCommunication_leadId_occurredAt_idx" ON "CrmCommunication"("leadId","occurredAt");
