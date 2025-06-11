-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "equipmentId" INTEGER;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
