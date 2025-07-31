-- CreateTable
CREATE TABLE "workshop_executors" (
    "id" SERIAL NOT NULL,
    "workshopId" INTEGER NOT NULL,
    "executorId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'assigned',

    CONSTRAINT "workshop_executors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workshop_executors_workshopId_executorId_key" ON "workshop_executors"("workshopId", "executorId");

-- AddForeignKey
ALTER TABLE "workshop_executors" ADD CONSTRAINT "workshop_executors_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_executors" ADD CONSTRAINT "workshop_executors_executorId_fkey" FOREIGN KEY ("executorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
