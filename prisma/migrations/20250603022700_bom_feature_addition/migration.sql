/*
  Warnings:

  - You are about to drop the column `pumpModelId` on the `BOMItem` table. All the data in the column will be lost.
  - Added the required column `bomId` to the `BOMItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "BOMItem" DROP CONSTRAINT "BOMItem_pumpModelId_fkey";

-- AlterTable
ALTER TABLE "BOMItem" DROP COLUMN "pumpModelId",
ADD COLUMN     "bomId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "BOM" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "pumpModelId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BOM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BOMHeaderCustomField" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "bomId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BOMHeaderCustomField_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BOM" ADD CONSTRAINT "BOM_pumpModelId_fkey" FOREIGN KEY ("pumpModelId") REFERENCES "PumpModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BOMHeaderCustomField" ADD CONSTRAINT "BOMHeaderCustomField_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "BOM"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BOMItem" ADD CONSTRAINT "BOMItem_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "BOM"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
