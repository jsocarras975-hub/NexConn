-- M7 (code audit 2026-11-25): the CRM tables stored customerId, assignedToId,
-- createdById and authorId as plain strings with no foreign keys, and the hot
-- FK columns on orders, invoices, tickets, messages and projects had no
-- indexes. Wire the CRM references to real relations and index the hot keys.
-- Orphaned optional references are cleared first so the constraints apply
-- cleanly (users and leads cannot be deleted, so orphans should not exist,
-- but a stale id must never block the deploy).
UPDATE "CrmLead" SET "customerId" = NULL WHERE "customerId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" WHERE "User"."id" = "CrmLead"."customerId");
UPDATE "CrmLead" SET "assignedToId" = NULL WHERE "assignedToId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" WHERE "User"."id" = "CrmLead"."assignedToId");
UPDATE "CrmTask" SET "customerId" = NULL WHERE "customerId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" WHERE "User"."id" = "CrmTask"."customerId");
UPDATE "CrmTask" SET "leadId" = NULL WHERE "leadId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "CrmLead" WHERE "CrmLead"."id" = "CrmTask"."leadId");
UPDATE "CrmTask" SET "assignedToId" = NULL WHERE "assignedToId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" WHERE "User"."id" = "CrmTask"."assignedToId");
UPDATE "CrmNote" SET "customerId" = NULL WHERE "customerId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" WHERE "User"."id" = "CrmNote"."customerId");
UPDATE "CrmNote" SET "leadId" = NULL WHERE "leadId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "CrmLead" WHERE "CrmLead"."id" = "CrmNote"."leadId");
UPDATE "CrmCommunication" SET "customerId" = NULL WHERE "customerId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" WHERE "User"."id" = "CrmCommunication"."customerId");
UPDATE "CrmCommunication" SET "leadId" = NULL WHERE "leadId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "CrmLead" WHERE "CrmLead"."id" = "CrmCommunication"."leadId");

-- Foreign keys for the CRM references.
ALTER TABLE "CrmLead" ADD CONSTRAINT "CrmLead_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmLead" ADD CONSTRAINT "CrmLead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmLead" ADD CONSTRAINT "CrmLead_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "CrmLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CrmNote" ADD CONSTRAINT "CrmNote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmNote" ADD CONSTRAINT "CrmNote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "CrmLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmNote" ADD CONSTRAINT "CrmNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CrmCommunication" ADD CONSTRAINT "CrmCommunication_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmCommunication" ADD CONSTRAINT "CrmCommunication_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "CrmLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmCommunication" ADD CONSTRAINT "CrmCommunication_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CrmWorkflow" ADD CONSTRAINT "CrmWorkflow_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CrmWorkflowRun" ADD CONSTRAINT "CrmWorkflowRun_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "CrmWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes on the hot FK columns.
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");
CREATE INDEX "Project_clientId_createdAt_idx" ON "Project"("clientId", "createdAt");
CREATE INDEX "Project_status_createdAt_idx" ON "Project"("status", "createdAt");
CREATE INDEX "Ticket_userId_createdAt_idx" ON "Ticket"("userId", "createdAt");
CREATE INDEX "Ticket_status_createdAt_idx" ON "Ticket"("status", "createdAt");
CREATE INDEX "Message_ticketId_createdAt_idx" ON "Message"("ticketId", "createdAt");
CREATE INDEX "Message_projectId_createdAt_idx" ON "Message"("projectId", "createdAt");
CREATE INDEX "Message_authorId_createdAt_idx" ON "Message"("authorId", "createdAt");
CREATE INDEX "Invoice_userId_createdAt_idx" ON "Invoice"("userId", "createdAt");
CREATE INDEX "Invoice_status_createdAt_idx" ON "Invoice"("status", "createdAt");
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");
CREATE INDEX "CrmLead_createdById_idx" ON "CrmLead"("createdById");
CREATE INDEX "CrmTask_assignedToId_idx" ON "CrmTask"("assignedToId");
CREATE INDEX "CrmTask_createdById_idx" ON "CrmTask"("createdById");
CREATE INDEX "CrmNote_authorId_createdAt_idx" ON "CrmNote"("authorId", "createdAt");
CREATE INDEX "CrmCommunication_authorId_occurredAt_idx" ON "CrmCommunication"("authorId", "occurredAt");
CREATE INDEX "CrmWorkflow_createdById_idx" ON "CrmWorkflow"("createdById");
