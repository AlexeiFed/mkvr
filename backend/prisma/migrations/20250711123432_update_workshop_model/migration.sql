/*
  Warnings:

  - You are about to drop the column `school` on the `workshops` table. All the data in the column will be lost.
  - You are about to drop the column `shift` on the `workshops` table. All the data in the column will be lost.
  - Added the required column `schoolId` to the `workshops` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time` to the `workshops` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "workshopId" INTEGER;

-- AlterTable
ALTER TABLE "workshops" DROP COLUMN "school",
DROP COLUMN "shift",
ADD COLUMN     "classId" INTEGER,
ADD COLUMN     "paidParticipants" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "schoolId" INTEGER NOT NULL,
ADD COLUMN     "time" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "order_complectations" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "subServiceId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_complectations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "workshops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_complectations" ADD CONSTRAINT "order_complectations_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_complectations" ADD CONSTRAINT "order_complectations_subServiceId_fkey" FOREIGN KEY ("subServiceId") REFERENCES "sub_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshops" ADD CONSTRAINT "workshops_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshops" ADD CONSTRAINT "workshops_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;
