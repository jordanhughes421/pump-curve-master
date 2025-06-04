-- DropForeignKey
ALTER TABLE "BOMItem" DROP CONSTRAINT "BOMItem_parentId_fkey";

-- AlterTable
ALTER TABLE "BOMItem" ADD COLUMN     "standardPartId" INTEGER;

-- CreateTable
CREATE TABLE "StandardPart" (
    "id" SERIAL NOT NULL,
    "partNumber" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "defaultUnit" TEXT NOT NULL,
    "defaultSupplier" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentId" INTEGER,

    CONSTRAINT "StandardPart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StandardPart_partNumber_key" ON "StandardPart"("partNumber");

-- CreateIndex
CREATE INDEX "StandardPart_partNumber_idx" ON "StandardPart"("partNumber");

-- AddForeignKey
ALTER TABLE "BOMItem" ADD CONSTRAINT "BOMItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BOMItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BOMItem" ADD CONSTRAINT "BOMItem_standardPartId_fkey" FOREIGN KEY ("standardPartId") REFERENCES "StandardPart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandardPart" ADD CONSTRAINT "StandardPart_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "StandardPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
