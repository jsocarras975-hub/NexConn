-- Account deletion (M11): deleting a user anonymizes their financial
-- records instead of blocking the delete or destroying them. Order and
-- Invoice keep their amounts, items, and Stripe references; only the link
-- to the person is removed (userId -> NULL). CRM records the user created
-- or authored are likewise nulled instead of blocking the delete.
-- Columns must be nullable before a SET NULL foreign key can act on them.
ALTER TABLE "Order" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Invoice" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "CrmLead" ALTER COLUMN "createdById" DROP NOT NULL;
ALTER TABLE "CrmTask" ALTER COLUMN "createdById" DROP NOT NULL;
ALTER TABLE "CrmNote" ALTER COLUMN "authorId" DROP NOT NULL;
ALTER TABLE "CrmCommunication" ALTER COLUMN "authorId" DROP NOT NULL;
ALTER TABLE "CrmWorkflow" ALTER COLUMN "createdById" DROP NOT NULL;

ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_userId_fkey";
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CrmLead" DROP CONSTRAINT "CrmLead_createdById_fkey";
ALTER TABLE "CrmLead" ADD CONSTRAINT "CrmLead_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CrmTask" DROP CONSTRAINT "CrmTask_createdById_fkey";
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CrmNote" DROP CONSTRAINT "CrmNote_authorId_fkey";
ALTER TABLE "CrmNote" ADD CONSTRAINT "CrmNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CrmCommunication" DROP CONSTRAINT "CrmCommunication_authorId_fkey";
ALTER TABLE "CrmCommunication" ADD CONSTRAINT "CrmCommunication_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CrmWorkflow" DROP CONSTRAINT "CrmWorkflow_createdById_fkey";
ALTER TABLE "CrmWorkflow" ADD CONSTRAINT "CrmWorkflow_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
