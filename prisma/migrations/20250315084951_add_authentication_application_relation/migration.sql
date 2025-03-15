/*
  Warnings:

  - Added the required column `applicationId` to the `Authentication` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Authentication" ADD COLUMN     "applicationId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Authentication_applicationId_idx" ON "Authentication"("applicationId");

-- AddForeignKey
ALTER TABLE "Authentication" ADD CONSTRAINT "Authentication_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
