import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import {
  createBookingSchema,
  cancelBookingSchema,
  updateBookingStatusSchema,
  getAllBookingsSchema,
} from "@/lib/validators";

const MAX_BOOKINGS_PER_DAY = 20;

export const bookingRouter = router({
  create: protectedProcedure
    .input(createBookingSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (tx) => {
        // 1. Check slot exists and is not blocked
        const slot = await tx.timeSlot.findUnique({
          where: { id: input.slotId },
        });

        if (!slot) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Time slot not found",
          });
        }

        if (slot.isBlocked) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This time slot is blocked",
          });
        }

        // 2. Check slot is not in the past
        const now = new Date();
        const slotDate = new Date(slot.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (slotDate < today) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot book a slot in the past",
          });
        }

        if (slotDate.toDateString() === now.toDateString()) {
          const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
          if (slot.startTime <= currentTime) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cannot book a slot that has already passed today",
            });
          }
        }

        // 3. Check no double booking on this slot
        const existingSlotBooking = await tx.booking.findFirst({
          where: {
            slotId: input.slotId,
            status: { notIn: ["CANCELLED"] },
          },
        });

        if (existingSlotBooking) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This time slot is already booked",
          });
        }

        // 4. Check customer has no active booking
        const activeBooking = await tx.booking.findFirst({
          where: {
            userId: ctx.user.userId,
            status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
          },
        });

        if (activeBooking) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "You already have an active booking. Please cancel it before making a new one.",
          });
        }

        // 5. Check daily booking limit
        const dailyCount = await tx.booking.count({
          where: {
            slot: { date: slot.date },
            status: { notIn: ["CANCELLED"] },
          },
        });

        if (dailyCount >= MAX_BOOKINGS_PER_DAY) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Maximum bookings for this day has been reached",
          });
        }

        // 6. Create booking
        return tx.booking.create({
          data: {
            userId: ctx.user.userId,
            slotId: input.slotId,
            note: input.note,
          },
          include: {
            slot: true,
          },
        });
      });
    }),

  cancel: protectedProcedure
    .input(cancelBookingSchema)
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.prisma.booking.findFirst({
        where: {
          id: input.bookingId,
          userId: ctx.user.userId,
        },
      });

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Booking not found",
        });
      }

      if (booking.status === "CANCELLED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Booking is already cancelled",
        });
      }

      if (booking.status === "COMPLETED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot cancel a completed booking",
        });
      }

      return ctx.prisma.booking.update({
        where: { id: input.bookingId },
        data: { status: "CANCELLED" },
        include: { slot: true },
      });
    }),

  getMyBookings: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.booking.findMany({
      where: { userId: ctx.user.userId },
      include: {
        slot: true,
      },
      orderBy: [{ slot: { date: "desc" } }, { slot: { startTime: "desc" } }],
    });
  }),

  getAll: adminProcedure
    .input(getAllBookingsSchema)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};

      if (input.status) {
        where.status = input.status;
      }

      if (input.date) {
        where.slot = { date: new Date(input.date + "T00:00:00") };
      }

      const [bookings, total] = await Promise.all([
        ctx.prisma.booking.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
            slot: true,
          },
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.prisma.booking.count({ where }),
      ]);

      return {
        bookings,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  updateStatus: adminProcedure
    .input(updateBookingStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.prisma.booking.findUnique({
        where: { id: input.bookingId },
      });

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Booking not found",
        });
      }

      // Validate status transitions
      const validTransitions: Record<string, string[]> = {
        PENDING: ["CONFIRMED", "CANCELLED"],
        CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
        IN_PROGRESS: ["COMPLETED", "CANCELLED"],
        COMPLETED: [],
        CANCELLED: [],
      };

      const allowed = validTransitions[booking.status] ?? [];
      if (!allowed.includes(input.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot transition from ${booking.status} to ${input.status}`,
        });
      }

      return ctx.prisma.booking.update({
        where: { id: input.bookingId },
        data: { status: input.status },
        include: { slot: true, user: { select: { id: true, firstName: true, lastName: true } } },
      });
    }),
});
