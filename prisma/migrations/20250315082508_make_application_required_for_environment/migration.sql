/*
  Warnings:

  - Made the column `applicationId` on table `Environment` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateDefaultApplication
INSERT INTO "Application" (id, name, "createdAt", "updatedAt")
SELECT 
  'default-app-id',
  'Application par défaut',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "Application" WHERE id = 'default-app-id'
);

-- UpdateExistingEnvironments
UPDATE "Environment"
SET "applicationId" = 'default-app-id'
WHERE "applicationId" IS NULL;

-- DropForeignKey
ALTER TABLE "Environment" DROP CONSTRAINT "Environment_applicationId_fkey";

-- AlterTable
ALTER TABLE "Environment" ALTER COLUMN "applicationId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Environment_applicationId_idx" ON "Environment"("applicationId");

-- AddForeignKey
ALTER TABLE "Environment" ADD CONSTRAINT "Environment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
