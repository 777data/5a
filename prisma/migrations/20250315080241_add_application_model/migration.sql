-- AlterTable
ALTER TABLE "Environment" ADD COLUMN     "applicationId" TEXT;

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Application_name_key" ON "Application"("name");

-- AddForeignKey
ALTER TABLE "Environment" ADD CONSTRAINT "Environment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;
