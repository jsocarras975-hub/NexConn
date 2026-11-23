-- Configurable CRM workflows and idempotent execution history.
CREATE TABLE "CrmWorkflow" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "trigger" TEXT NOT NULL,
  "action" TEXT NOT NULL, "config" JSONB NOT NULL, "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CrmWorkflow_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CrmWorkflow_enabled_trigger_idx" ON "CrmWorkflow"("enabled","trigger");
CREATE TABLE "CrmWorkflowRun" (
  "id" TEXT NOT NULL, "workflowId" TEXT NOT NULL, "dedupeKey" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RUNNING', "result" JSONB, "error" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "finishedAt" TIMESTAMP(3),
  CONSTRAINT "CrmWorkflowRun_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CrmWorkflowRun_workflowId_dedupeKey_key" ON "CrmWorkflowRun"("workflowId","dedupeKey");
CREATE INDEX "CrmWorkflowRun_status_startedAt_idx" ON "CrmWorkflowRun"("status","startedAt");
