-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "originalSlotId" INTEGER,
ADD COLUMN     "rescheduledAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "waitlists" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "slotId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_bookings" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "slotId" INTEGER NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "cancelToken" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_holidays" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "reason" TEXT,

    CONSTRAINT "shop_holidays_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "waitlists_userId_slotId_key" ON "waitlists"("userId", "slotId");

-- CreateIndex
CREATE UNIQUE INDEX "guest_bookings_cancelToken_key" ON "guest_bookings"("cancelToken");

-- CreateIndex
CREATE UNIQUE INDEX "shop_holidays_date_key" ON "shop_holidays"("date");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_originalSlotId_fkey" FOREIGN KEY ("originalSlotId") REFERENCES "time_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlists" ADD CONSTRAINT "waitlists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlists" ADD CONSTRAINT "waitlists_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "time_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_bookings" ADD CONSTRAINT "guest_bookings_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "time_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
