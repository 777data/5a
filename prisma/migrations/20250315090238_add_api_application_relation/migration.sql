/*
  Warnings:

  - Added the required column `applicationId` to the `Api` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Api" ADD COLUMN     "applicationId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Api_applicationId_idx" ON "Api"("applicationId");

-- AddForeignKey
ALTER TABLE "Api" ADD CONSTRAINT "Api_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
