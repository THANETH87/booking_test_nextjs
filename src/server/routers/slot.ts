import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure, adminProcedure } from "../trpc";
import {
  getAvailableSlotsSchema,
  blockSlotSchema,
  createSlotSchema,
  updateSlotSchema,
  deleteSlotSchema,
} from "@/lib/validators";

function generateSlots(): { startTime: string; endTime: string }[] {
  const slots: { startTime: string; endTime: string }[] = [];
  for (let hour = 9; hour < 20; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const endHour = min === 30 ? hour + 1 : hour;
      const endMin = min === 30 ? 0 : 30;
      slots.push({
        startTime: `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
        endTime: `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`,
      });
    }
  }
  return slots;
}

export const slotRouter = router({
  getAvailable: publicProcedure
    .input(getAvailableSlotsSchema)
    .query(async ({ ctx, input }) => {
      // Use UTC midnight to match PostgreSQL @db.Date storage
      const date = new Date(input.date + "T00:00:00Z");
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      if (input.date < todayStr) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot view slots for past dates",
        });
      }

      // Check if holiday
      const holiday = await ctx.prisma.shopHoliday.findUnique({
        where: { date },
      });
      if (holiday) {
        return [];
      }

      // Lazy-generate slots for this date if none exist
      const existingCount = await ctx.prisma.timeSlot.count({
        where: { date },
      });

      if (existingCount === 0) {
        const slotTemplates = generateSlots();
        await ctx.prisma.timeSlot.createMany({
          data: slotTemplates.map((s) => ({
            date,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
          skipDuplicates: true,
        });
      }

      const slots = await ctx.prisma.timeSlot.findMany({
        where: { date },
        include: {
          bookings: {
            where: {
              status: { notIn: ["CANCELLED"] },
            },
            select: { id: true },
          },
          guestBookings: {
            where: {
              status: { notIn: ["CANCELLED"] },
            },
            select: { id: true },
          },
        },
        orderBy: { startTime: "asc" },
      });
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const isToday = input.date === todayStr;

      return slots.map((slot) => ({
        id: slot.id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBlocked: slot.isBlocked,
        blockedReason: slot.blockedReason,
        isBooked: slot.bookings.length > 0 || slot.guestBookings.length > 0,
        isPast: isToday && slot.startTime <= currentTime,
      }));
    }),

  blockSlot: adminProcedure
    .input(blockSlotSchema)
    .mutation(async ({ ctx, input }) => {
      const slot = await ctx.prisma.timeSlot.findUnique({
        where: { id: input.slotId },
      });

      if (!slot) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Slot not found" });
      }

      // Cancel any active bookings on this slot
      await ctx.prisma.booking.updateMany({
        where: {
          slotId: input.slotId,
          status: { notIn: ["CANCELLED", "COMPLETED"] },
        },
        data: { status: "CANCELLED" },
      });

      return ctx.prisma.timeSlot.update({
        where: { id: input.slotId },
        data: {
          isBlocked: true,
          blockedReason: input.reason ?? null,
        },
      });
    }),

  unblockSlot: adminProcedure
    .input(z.object({ slotId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const slot = await ctx.prisma.timeSlot.findUnique({
        where: { id: input.slotId },
      });

      if (!slot) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Slot not found" });
      }

      return ctx.prisma.timeSlot.update({
        where: { id: input.slotId },
        data: {
          isBlocked: false,
          blockedReason: null,
        },
      });
    }),

  create: adminProcedure
    .input(createSlotSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.startTime >= input.endTime) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Start time must be before end time",
        });
      }

      const date = new Date(input.date + "T00:00:00Z");

      const existing = await ctx.prisma.timeSlot.findFirst({
        where: { date, startTime: input.startTime },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A slot with this date and start time already exists",
        });
      }

      return ctx.prisma.timeSlot.create({
        data: {
          date,
          startTime: input.startTime,
          endTime: input.endTime,
        },
      });
    }),

  update: adminProcedure
    .input(updateSlotSchema)
    .mutation(async ({ ctx, input }) => {
      const slot = await ctx.prisma.timeSlot.findUnique({
        where: { id: input.slotId },
      });

      if (!slot) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Slot not found" });
      }

      const newStart = input.startTime ?? slot.startTime;
      const newEnd = input.endTime ?? slot.endTime;
      if (newStart >= newEnd) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Start time must be before end time",
        });
      }

      const { slotId, ...data } = input;
      return ctx.prisma.timeSlot.update({
        where: { id: slotId },
        data,
      });
    }),

  delete: adminProcedure
    .input(deleteSlotSchema)
    .mutation(async ({ ctx, input }) => {
      const slot = await ctx.prisma.timeSlot.findUnique({
        where: { id: input.slotId },
        include: {
          bookings: {
            where: { status: { notIn: ["CANCELLED", "COMPLETED"] } },
            select: { id: true },
          },
        },
      });

      if (!slot) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Slot not found" });
      }

      if (slot.bookings.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete a slot with active bookings. Cancel them first.",
        });
      }

      // Delete related cancelled/completed bookings first, then slot
      await ctx.prisma.booking.deleteMany({
        where: { slotId: input.slotId },
      });

      await ctx.prisma.timeSlot.delete({
        where: { id: input.slotId },
      });

      return { id: input.slotId };
    }),

  getHolidayDates: publicProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setDate(end.getDate() + 60);

    const holidays = await ctx.prisma.shopHoliday.findMany({
      where: { date: { gte: start, lte: end } },
      select: { date: true, reason: true },
      orderBy: { date: "asc" },
    });

    return holidays.map((h) => ({
      date: h.date.toISOString().split("T")[0],
      reason: h.reason,
    }));
  }),
});
