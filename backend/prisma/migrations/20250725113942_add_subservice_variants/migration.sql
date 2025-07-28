/*
  Warnings:

  - You are about to drop the column `price` on the `sub_services` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "order_complectations" ADD COLUMN     "variantId" INTEGER;

-- AlterTable
ALTER TABLE "sub_services" DROP COLUMN "price",
ADD COLUMN     "hasVariants" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "sub_service_variants" (
    "id" SERIAL NOT NULL,
    "subServiceId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_service_variants_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sub_service_variants" ADD CONSTRAINT "sub_service_variants_subServiceId_fkey" FOREIGN KEY ("subServiceId") REFERENCES "sub_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_complectations" ADD CONSTRAINT "order_complectations_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "sub_service_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
