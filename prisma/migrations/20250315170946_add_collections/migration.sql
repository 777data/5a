-- DropIndex
DROP INDEX "Api_applicationId_idx";

-- DropIndex
DROP INDEX "Application_name_key";

-- DropIndex
DROP INDEX "Authentication_applicationId_idx";

-- DropIndex
DROP INDEX "Authentication_name_key";

-- DropIndex
DROP INDEX "Environment_applicationId_idx";

-- AlterTable
ALTER TABLE "Api" ADD COLUMN     "collectionId" TEXT;

-- AlterTable
ALTER TABLE "Authentication" ADD COLUMN     "type" TEXT,
ALTER COLUMN "token" DROP NOT NULL,
ALTER COLUMN "apiKey" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "applicationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiTest" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL,
    "authenticationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiTestResult" (
    "id" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "response" JSONB NOT NULL,
    "error" TEXT,
    "apiTestId" TEXT NOT NULL,
    "apiId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiTestResult_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Api" ADD CONSTRAINT "Api_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiTest" ADD CONSTRAINT "ApiTest_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiTest" ADD CONSTRAINT "ApiTest_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiTest" ADD CONSTRAINT "ApiTest_authenticationId_fkey" FOREIGN KEY ("authenticationId") REFERENCES "Authentication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiTestResult" ADD CONSTRAINT "ApiTestResult_apiTestId_fkey" FOREIGN KEY ("apiTestId") REFERENCES "ApiTest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiTestResult" ADD CONSTRAINT "ApiTestResult_apiId_fkey" FOREIGN KEY ("apiId") REFERENCES "Api"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
