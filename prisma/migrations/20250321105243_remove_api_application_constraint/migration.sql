/*
  Warnings:

  - You are about to drop the column `applicationId` on the `Api` table. All the data in the column will be lost.
  - Made the column `collectionId` on table `Api` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Api" DROP CONSTRAINT "Api_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "Api" DROP CONSTRAINT "Api_collectionId_fkey";

-- AlterTable
ALTER TABLE "Api" DROP COLUMN "applicationId",
ALTER COLUMN "collectionId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Api" ADD CONSTRAINT "Api_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
