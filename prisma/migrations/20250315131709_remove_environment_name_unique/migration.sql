/*
  Warnings:

  - You are about to drop the column `variableId` on the `VariableValue` table. All the data in the column will be lost.
  - You are about to drop the `Variable` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name,environmentId]` on the table `VariableValue` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `VariableValue` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "VariableValue" DROP CONSTRAINT "VariableValue_variableId_fkey";

-- DropIndex
DROP INDEX "Environment_name_key";

-- DropIndex
DROP INDEX "VariableValue_variableId_environmentId_key";

-- AlterTable
ALTER TABLE "VariableValue" DROP COLUMN "variableId",
ADD COLUMN     "name" TEXT NOT NULL;

-- DropTable
DROP TABLE "Variable";

-- CreateIndex
CREATE INDEX "VariableValue_environmentId_idx" ON "VariableValue"("environmentId");

-- CreateIndex
CREATE UNIQUE INDEX "VariableValue_name_environmentId_key" ON "VariableValue"("name", "environmentId");
