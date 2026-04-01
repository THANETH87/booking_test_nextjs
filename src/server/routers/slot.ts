import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure, adminProcedure } from "../trpc";
import { getAvailableSlotsSchema, blockSlotSchema } from "@/lib/validators";

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
      const date = new Date(input.date + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (date < today) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot view slots for past dates",
        });
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
        },
        orderBy: { startTime: "asc" },
      });

      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const isToday = date.toDateString() === now.toDateString();

      return slots.map((slot) => ({
        id: slot.id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBlocked: slot.isBlocked,
        blockedReason: slot.blockedReason,
        isBooked: slot.bookings.length > 0,
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
});
