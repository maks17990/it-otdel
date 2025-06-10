-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'DONE', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "RequestSource" AS ENUM ('WEB', 'TELEGRAM', 'PHONE');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin', 'superuser');

-- CreateEnum
CREATE TYPE "Department" AS ENUM ('AHO', 'ADMIN', 'STATIONAR', 'GYN', 'INFECT', 'GP', 'OPHTHALMO', 'ENT', 'NURSE', 'EMERGENCY', 'UZI', 'STATISTICS', 'DIABET_SCHOOL', 'ENDOSCOPY', 'LAB', 'VOENKOM', 'ELDERLY', 'PREVENTION', 'PAID', 'FUNCTIONAL', 'VACCINATION', 'PROCEDURE', 'REGISTRY', 'XRAY', 'THERAPY_1', 'THERAPY_2', 'THERAPY_3', 'THERAPY_4', 'THERAPY_5', 'PHYSIOTHERAPY', 'SURGERY', 'STERILIZATION', 'HEALTH_CENTER');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "middleName" VARCHAR(100),
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'user',
    "birthDate" DATE NOT NULL,
    "snils" VARCHAR(20) NOT NULL,
    "mobilePhone" VARCHAR(20) NOT NULL,
    "internalPhone" VARCHAR(10) NOT NULL,
    "position" VARCHAR(100) NOT NULL,
    "department" "Department" NOT NULL,
    "floor" VARCHAR(10),
    "cabinet" VARCHAR(10),
    "telegramUserId" BIGINT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" SERIAL NOT NULL,
    "inventoryNumber" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "macAddress" VARCHAR(50),
    "ipAddress" VARCHAR(50),
    "login" VARCHAR(50),
    "password" VARCHAR(50),
    "location" VARCHAR(50) NOT NULL,
    "floor" VARCHAR(10),
    "cabinet" VARCHAR(10),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fileUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "assignedToUserId" INTEGER,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Software" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "version" VARCHAR(50),
    "licenseKey" VARCHAR(255),
    "licensedTo" VARCHAR(100),
    "adminLogin" VARCHAR(50),
    "adminPassword" VARCHAR(50),
    "networkAddress" VARCHAR(100),
    "floor" VARCHAR(10),
    "cabinet" VARCHAR(10),
    "purchaseDate" TIMESTAMP(3),
    "supportStart" TIMESTAMP(3),
    "supportEnd" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "fileUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "installDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Software_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Request" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "content" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'NEW',
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "category" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expectedResolutionDate" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "assignedAt" TIMESTAMP(3),
    "workDuration" INTEGER,
    "source" "RequestSource" DEFAULT 'WEB',
    "userId" INTEGER NOT NULL,
    "executorId" INTEGER,
    "rating" INTEGER,
    "feedback" TEXT,
    "fileUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "requestId" INTEGER NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" INTEGER,
    "role" "Role",
    "department" "Department",
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "News" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EquipmentToSoftware" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_EquipmentToSoftware_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_UserToSoftware" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserToSoftware_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_snils_key" ON "User"("snils");

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramUserId_key" ON "User"("telegramUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_inventoryNumber_key" ON "Equipment"("inventoryNumber");

-- CreateIndex
CREATE INDEX "Comment_createdAt_idx" ON "Comment"("createdAt");

-- CreateIndex
CREATE INDEX "_EquipmentToSoftware_B_index" ON "_EquipmentToSoftware"("B");

-- CreateIndex
CREATE INDEX "_UserToSoftware_B_index" ON "_UserToSoftware"("B");

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_executorId_fkey" FOREIGN KEY ("executorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EquipmentToSoftware" ADD CONSTRAINT "_EquipmentToSoftware_A_fkey" FOREIGN KEY ("A") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EquipmentToSoftware" ADD CONSTRAINT "_EquipmentToSoftware_B_fkey" FOREIGN KEY ("B") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserToSoftware" ADD CONSTRAINT "_UserToSoftware_A_fkey" FOREIGN KEY ("A") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserToSoftware" ADD CONSTRAINT "_UserToSoftware_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
