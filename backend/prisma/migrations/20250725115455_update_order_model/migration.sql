/*
  Warnings:

  - You are about to drop the column `grade` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `penType` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `personalInscription` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `school` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `shift` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `stickers` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `varnish` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "orders" DROP COLUMN "grade",
DROP COLUMN "penType",
DROP COLUMN "personalInscription",
DROP COLUMN "school",
DROP COLUMN "shift",
DROP COLUMN "stickers",
DROP COLUMN "varnish",
ADD COLUMN     "notes" TEXT;
