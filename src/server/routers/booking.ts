import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import {
  createBookingSchema,
  cancelBookingSchema,
  updateBookingStatusSchema,
  updateBookingSchema,
  deleteBookingSchema,
  getAllBookingsSchema,
  rescheduleBookingSchema,
} from "@/lib/validators";
import { sendEmail } from "@/lib/email";
import { bookingConfirmation, bookingStatusChanged, rescheduleConfirmation } from "@/lib/email-templates";
import { notifyNextInWaitlist } from "@/lib/waitlist-notify";

const MAX_BOOKINGS_PER_DAY = 20;

export const bookingRouter = router({
  create: protectedProcedure
    .input(createBookingSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.$transaction(async (tx) => {
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
        // Compare using date strings (YYYY-MM-DD) to avoid timezone issues
        const now = new Date();
        const slotDateStr = slot.date.toISOString().split("T")[0];
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        if (slotDateStr < todayStr) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot book a slot in the past",
          });
        }

        if (slotDateStr === todayStr) {
          const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
          if (slot.startTime <= currentTime) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cannot book a slot that has already passed today",
            });
          }
        }

        // 3. Check no double booking on this slot (both tables)
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

        const existingGuestBooking = await tx.guestBooking.findFirst({
          where: {
            slotId: input.slotId,
            status: { notIn: ["CANCELLED"] },
          },
        });

        if (existingGuestBooking) {
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

        // 5. Check daily booking limit (both tables)
        const dailyCount = await tx.booking.count({
          where: {
            slot: { date: slot.date },
            status: { notIn: ["CANCELLED"] },
          },
        });
        const guestDailyCount = await tx.guestBooking.count({
          where: {
            slot: { date: slot.date },
            status: { notIn: ["CANCELLED"] },
          },
        });

        if (dailyCount + guestDailyCount >= MAX_BOOKINGS_PER_DAY) {
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

      // Send confirmation email (fire-and-forget)
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.userId },
        select: { email: true, firstName: true },
      });
      if (user) {
        const dateStr = result.slot.date.toISOString().split("T")[0];
        const tmpl = bookingConfirmation(user.firstName, dateStr, result.slot.startTime, result.slot.endTime);
        sendEmail(user.email, tmpl.subject, tmpl.html);
      }

      return result;
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

      const result = await ctx.prisma.booking.update({
        where: { id: input.bookingId },
        data: { status: "CANCELLED" },
        include: { slot: true },
      });

      // Notify waitlist + send email
      notifyNextInWaitlist(ctx.prisma, result.slotId);
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.userId },
        select: { email: true, firstName: true },
      });
      if (user) {
        const dateStr = result.slot.date.toISOString().split("T")[0];
        const tmpl = bookingStatusChanged(user.firstName, "CANCELLED", dateStr, result.slot.startTime, result.slot.endTime);
        sendEmail(user.email, tmpl.subject, tmpl.html);
      }

      return result;
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

  update: adminProcedure
    .input(updateBookingSchema)
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

      if (booking.status === "COMPLETED" || booking.status === "CANCELLED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot edit a ${booking.status.toLowerCase()} booking`,
        });
      }

      if (input.slotId && input.slotId !== booking.slotId) {
        const slot = await ctx.prisma.timeSlot.findUnique({
          where: { id: input.slotId },
        });
        if (!slot) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Slot not found" });
        }
        if (slot.isBlocked) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Slot is blocked" });
        }
        const taken = await ctx.prisma.booking.findFirst({
          where: {
            slotId: input.slotId,
            status: { notIn: ["CANCELLED"] },
            id: { not: input.bookingId },
          },
        });
        if (taken) {
          throw new TRPCError({ code: "CONFLICT", message: "Slot already booked" });
        }
      }

      const { bookingId, ...data } = input;
      return ctx.prisma.booking.update({
        where: { id: bookingId },
        data,
        include: { slot: true, user: { select: { id: true, firstName: true, lastName: true } } },
      });
    }),

  delete: adminProcedure
    .input(deleteBookingSchema)
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

      await ctx.prisma.booking.delete({
        where: { id: input.bookingId },
      });

      return { id: input.bookingId };
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

      const result = await ctx.prisma.booking.update({
        where: { id: input.bookingId },
        data: { status: input.status },
        include: { slot: true, user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      });

      // Email + waitlist on status change
      if (result.user.email) {
        const dateStr = result.slot.date.toISOString().split("T")[0];
        const tmpl = bookingStatusChanged(result.user.firstName, input.status, dateStr, result.slot.startTime, result.slot.endTime);
        sendEmail(result.user.email, tmpl.subject, tmpl.html);
      }
      if (input.status === "CANCELLED") {
        notifyNextInWaitlist(ctx.prisma, result.slotId);
      }

      return result;
    }),

  reschedule: protectedProcedure
    .input(rescheduleBookingSchema)
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.prisma.booking.findFirst({
        where: { id: input.bookingId, userId: ctx.user.userId },
        include: { slot: true },
      });

      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      }

      if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Can only reschedule PENDING or CONFIRMED bookings" });
      }

      if (booking.rescheduledAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Booking has already been rescheduled once" });
      }

      const newSlot = await ctx.prisma.timeSlot.findUnique({
        where: { id: input.newSlotId },
      });

      if (!newSlot) {
        throw new TRPCError({ code: "NOT_FOUND", message: "New slot not found" });
      }

      if (newSlot.isBlocked) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "New slot is blocked" });
      }

      // Check not in past
      const now = new Date();
      const slotDateStr = newSlot.date.toISOString().split("T")[0];
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      if (slotDateStr < todayStr) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot reschedule to a past slot" });
      }

      // Check not taken
      const taken = await ctx.prisma.booking.findFirst({
        where: { slotId: input.newSlotId, status: { notIn: ["CANCELLED"] }, id: { not: input.bookingId } },
      });
      if (taken) {
        throw new TRPCError({ code: "CONFLICT", message: "New slot is already booked" });
      }
      const guestTaken = await ctx.prisma.guestBooking.findFirst({
        where: { slotId: input.newSlotId, status: { notIn: ["CANCELLED"] } },
      });
      if (guestTaken) {
        throw new TRPCError({ code: "CONFLICT", message: "New slot is already booked" });
      }

      const oldSlotId = booking.slotId;
      const result = await ctx.prisma.booking.update({
        where: { id: input.bookingId },
        data: {
          slotId: input.newSlotId,
          rescheduledAt: new Date(),
          originalSlotId: oldSlotId,
        },
        include: { slot: true },
      });

      // Notify waitlist for freed old slot
      notifyNextInWaitlist(ctx.prisma, oldSlotId);

      // Send reschedule email
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.userId },
        select: { email: true, firstName: true },
      });
      if (user) {
        const oldDateStr = booking.slot.date.toISOString().split("T")[0];
        const newDateStr = newSlot.date.toISOString().split("T")[0];
        const tmpl = rescheduleConfirmation(
          user.firstName,
          oldDateStr, booking.slot.startTime,
          newDateStr, newSlot.startTime + " - " + newSlot.endTime
        );
        sendEmail(user.email, tmpl.subject, tmpl.html);
      }

      return result;
    }),
});
