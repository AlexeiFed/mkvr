/*
  Warnings:

  - You are about to drop the column `video` on the `sub_service_variants` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sub_service_variants" DROP COLUMN "video",
ADD COLUMN     "videos" TEXT[];
