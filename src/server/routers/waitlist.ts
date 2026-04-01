import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import {
  joinWaitlistSchema,
  leaveWaitlistSchema,
  getWaitlistBySlotSchema,
} from "@/lib/validators";

export const waitlistRouter = router({
  join: protectedProcedure
    .input(joinWaitlistSchema)
    .mutation(async ({ ctx, input }) => {
      const slot = await ctx.prisma.timeSlot.findUnique({
        where: { id: input.slotId },
      });

      if (!slot) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Slot not found" });
      }

      // Check slot is actually booked
      const hasBooking = await ctx.prisma.booking.findFirst({
        where: { slotId: input.slotId, status: { notIn: ["CANCELLED"] } },
      });
      const hasGuestBooking = await ctx.prisma.guestBooking.findFirst({
        where: { slotId: input.slotId, status: { notIn: ["CANCELLED"] } },
      });

      if (!hasBooking && !hasGuestBooking) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Slot is available — book directly instead of joining waitlist",
        });
      }

      // Check not already on waitlist
      const existing = await ctx.prisma.waitlist.findUnique({
        where: { userId_slotId: { userId: ctx.user.userId, slotId: input.slotId } },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Already on waitlist for this slot",
        });
      }

      // Get next position
      const maxEntry = await ctx.prisma.waitlist.findFirst({
        where: { slotId: input.slotId },
        orderBy: { position: "desc" },
      });

      return ctx.prisma.waitlist.create({
        data: {
          userId: ctx.user.userId,
          slotId: input.slotId,
          position: (maxEntry?.position ?? 0) + 1,
        },
      });
    }),

  leave: protectedProcedure
    .input(leaveWaitlistSchema)
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.prisma.waitlist.findUnique({
        where: { userId_slotId: { userId: ctx.user.userId, slotId: input.slotId } },
      });

      if (!entry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Not on waitlist for this slot",
        });
      }

      await ctx.prisma.waitlist.delete({ where: { id: entry.id } });

      // Reorder remaining
      await ctx.prisma.waitlist.updateMany({
        where: { slotId: input.slotId, position: { gt: entry.position } },
        data: { position: { decrement: 1 } },
      });

      return { success: true };
    }),

  getMyPosition: protectedProcedure
    .input(joinWaitlistSchema)
    .query(async ({ ctx, input }) => {
      const entry = await ctx.prisma.waitlist.findUnique({
        where: { userId_slotId: { userId: ctx.user.userId, slotId: input.slotId } },
      });

      if (!entry) return null;

      const totalInQueue = await ctx.prisma.waitlist.count({
        where: { slotId: input.slotId },
      });

      return { position: entry.position, totalInQueue };
    }),

  getBySlot: adminProcedure
    .input(getWaitlistBySlotSchema)
    .query(async ({ ctx, input }) => {
      return ctx.prisma.waitlist.findMany({
        where: { slotId: input.slotId },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
          },
        },
        orderBy: { position: "asc" },
      });
    }),
});
