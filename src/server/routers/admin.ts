import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { router, adminProcedure } from "../trpc";
import { sendEmail } from "@/lib/email";
import { bookingConfirmation, bookingStatusChanged, guestBookingConfirmation } from "@/lib/email-templates";
import {
  getAllUsersSchema,
  updateUserSchema,
  deleteUserSchema,
  registerSchema,
  addHolidaySchema,
  removeHolidaySchema,
  getHolidaysSchema,
  getAnalyticsSchema,
  createManualBookingSchema,
} from "@/lib/validators";

export const adminRouter = router({
  getDashboardStats: adminProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      todayTotal,
      todayPending,
      todayConfirmed,
      todayInProgress,
      todayCompleted,
      todayCancelled,
      totalCustomers,
      upcomingBookings,
    ] = await Promise.all([
      ctx.prisma.booking.count({
        where: { slot: { date: { gte: today, lt: tomorrow } } },
      }),
      ctx.prisma.booking.count({
        where: {
          slot: { date: { gte: today, lt: tomorrow } },
          status: "PENDING",
        },
      }),
      ctx.prisma.booking.count({
        where: {
          slot: { date: { gte: today, lt: tomorrow } },
          status: "CONFIRMED",
        },
      }),
      ctx.prisma.booking.count({
        where: {
          slot: { date: { gte: today, lt: tomorrow } },
          status: "IN_PROGRESS",
        },
      }),
      ctx.prisma.booking.count({
        where: {
          slot: { date: { gte: today, lt: tomorrow } },
          status: "COMPLETED",
        },
      }),
      ctx.prisma.booking.count({
        where: {
          slot: { date: { gte: today, lt: tomorrow } },
          status: "CANCELLED",
        },
      }),
      ctx.prisma.user.count({
        where: { role: "USER", deletedAt: null },
      }),
      ctx.prisma.booking.count({
        where: {
          slot: { date: { gt: today } },
          status: { notIn: ["CANCELLED", "COMPLETED"] },
        },
      }),
    ]);

    return {
      today: {
        total: todayTotal,
        pending: todayPending,
        confirmed: todayConfirmed,
        inProgress: todayInProgress,
        completed: todayCompleted,
        cancelled: todayCancelled,
      },
      totalCustomers,
      upcomingBookings,
    };
  }),

  // ─── User CRUD ───

  getUsers: adminProcedure
    .input(getAllUsersSchema)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { deletedAt: null };

      if (input.role) {
        where.role = input.role;
      }

      if (input.search) {
        where.OR = [
          { firstName: { contains: input.search, mode: "insensitive" } },
          { lastName: { contains: input.search, mode: "insensitive" } },
          { email: { contains: input.search, mode: "insensitive" } },
          { phone: { contains: input.search } },
        ];
      }

      const [users, total] = await Promise.all([
        ctx.prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            createdAt: true,
            _count: { select: { bookings: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.prisma.user.count({ where }),
      ]);

      return {
        users,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  getUser: adminProcedure
    .input(deleteUserSchema) // reuse { userId }
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          bookings: {
            include: { slot: true },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      return user;
    }),

  createUser: adminProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existing && !existing.deletedAt) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already registered",
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 12);

      return ctx.prisma.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
        },
      });
    }),

  updateUser: adminProcedure
    .input(updateUserSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user || user.deletedAt) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      if (input.email && input.email !== user.email) {
        const emailTaken = await ctx.prisma.user.findUnique({
          where: { email: input.email },
        });
        if (emailTaken && emailTaken.id !== user.id) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email already in use",
          });
        }
      }

      const { userId, ...data } = input;
      return ctx.prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
        },
      });
    }),

  deleteUser: adminProcedure
    .input(deleteUserSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user || user.deletedAt) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      // Soft delete
      return ctx.prisma.user.update({
        where: { id: input.userId },
        data: { deletedAt: new Date() },
        select: { id: true },
      });
    }),

  // ─── Holidays ───

  addHoliday: adminProcedure
    .input(addHolidaySchema)
    .mutation(async ({ ctx, input }) => {
      const date = new Date(input.date + "T00:00:00Z");

      const holiday = await ctx.prisma.shopHoliday.upsert({
        where: { date },
        create: { date, reason: input.reason },
        update: { reason: input.reason },
      });

      // Cancel all active bookings on that date
      const bookings = await ctx.prisma.booking.findMany({
        where: {
          slot: { date },
          status: { notIn: ["CANCELLED", "COMPLETED"] },
        },
        include: {
          user: { select: { email: true, firstName: true } },
          slot: { select: { date: true, startTime: true, endTime: true } },
        },
      });

      if (bookings.length > 0) {
        await ctx.prisma.booking.updateMany({
          where: {
            slot: { date },
            status: { notIn: ["CANCELLED", "COMPLETED"] },
          },
          data: { status: "CANCELLED" },
        });

        // Send cancellation emails
        for (const b of bookings) {
          const tmpl = bookingStatusChanged(
            b.user.firstName,
            "CANCELLED",
            input.date,
            b.slot.startTime,
            b.slot.endTime
          );
          sendEmail(b.user.email, tmpl.subject, tmpl.html);
        }
      }

      return holiday;
    }),

  removeHoliday: adminProcedure
    .input(removeHolidaySchema)
    .mutation(async ({ ctx, input }) => {
      const date = new Date(input.date + "T00:00:00Z");
      return ctx.prisma.shopHoliday.delete({ where: { date } });
    }),

  getHolidays: adminProcedure
    .input(getHolidaysSchema)
    .query(async ({ ctx, input }) => {
      const start = new Date(`${input.year}-01-01T00:00:00Z`);
      const end = new Date(`${input.year}-12-31T23:59:59Z`);

      return ctx.prisma.shopHoliday.findMany({
        where: { date: { gte: start, lte: end } },
        orderBy: { date: "asc" },
      });
    }),

  // ─── Manual Booking ───

  createManualBooking: adminProcedure
    .input(createManualBookingSchema)
    .mutation(async ({ ctx, input }) => {
      const slot = await ctx.prisma.timeSlot.findUnique({
        where: { id: input.slotId },
      });

      if (!slot) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Slot not found" });
      }
      if (slot.isBlocked) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Slot is blocked" });
      }

      // Check not taken (both tables)
      const taken = await ctx.prisma.booking.findFirst({
        where: { slotId: input.slotId, status: { notIn: ["CANCELLED"] } },
      });
      if (taken) {
        throw new TRPCError({ code: "CONFLICT", message: "Slot already booked" });
      }
      const guestTaken = await ctx.prisma.guestBooking.findFirst({
        where: { slotId: input.slotId, status: { notIn: ["CANCELLED"] } },
      });
      if (guestTaken) {
        throw new TRPCError({ code: "CONFLICT", message: "Slot already booked" });
      }

      const dateStr = slot.date.toISOString().split("T")[0];

      if (input.userId) {
        const user = await ctx.prisma.user.findUnique({
          where: { id: input.userId },
          select: { id: true, email: true, firstName: true },
        });
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        const booking = await ctx.prisma.booking.create({
          data: {
            userId: input.userId,
            slotId: input.slotId,
            status: "CONFIRMED",
            note: input.note,
          },
          include: { slot: true },
        });

        const tmpl = bookingConfirmation(user.firstName, dateStr, slot.startTime, slot.endTime);
        sendEmail(user.email, tmpl.subject, tmpl.html);

        return { type: "booking" as const, id: booking.id };
      }

      // Guest booking
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const guest = await ctx.prisma.guestBooking.create({
        data: {
          firstName: input.guestFirstName!,
          lastName: input.guestLastName!,
          email: input.guestEmail ?? "",
          phone: input.guestPhone!,
          slotId: input.slotId,
          status: "CONFIRMED",
          note: input.note,
        },
      });

      if (input.guestEmail) {
        const cancelUrl = `${baseUrl}/cancel?token=${guest.cancelToken}`;
        const tmpl = guestBookingConfirmation(
          input.guestFirstName!,
          dateStr,
          slot.startTime,
          slot.endTime,
          cancelUrl
        );
        sendEmail(input.guestEmail, tmpl.subject, tmpl.html);
      }

      return { type: "guestBooking" as const, id: guest.id };
    }),

  // ─── Analytics ───

  getAnalytics: adminProcedure
    .input(getAnalyticsSchema)
    .query(async ({ ctx, input }) => {
      const start = new Date(input.startDate + "T00:00:00Z");
      const end = new Date(input.endDate + "T23:59:59Z");

      const bookings = await ctx.prisma.booking.findMany({
        where: { slot: { date: { gte: start, lte: end } } },
        include: { slot: { select: { date: true, startTime: true } } },
      });

      const totalBookings = bookings.length;
      const completedBookings = bookings.filter((b) => b.status === "COMPLETED").length;
      const cancelledBookings = bookings.filter((b) => b.status === "CANCELLED").length;

      // No-show: slots in the past that were PENDING/CONFIRMED (never started)
      const now = new Date();
      const noShowCount = bookings.filter(
        (b) =>
          ["PENDING", "CONFIRMED"].includes(b.status) &&
          new Date(b.slot.date) < now
      ).length;

      // Bookings by day
      const byDayMap = new Map<string, number>();
      for (const b of bookings) {
        const d = b.slot.date.toISOString().split("T")[0];
        byDayMap.set(d, (byDayMap.get(d) ?? 0) + 1);
      }
      const bookingsByDay = Array.from(byDayMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Bookings by status
      const byStatusMap = new Map<string, number>();
      for (const b of bookings) {
        byStatusMap.set(b.status, (byStatusMap.get(b.status) ?? 0) + 1);
      }
      const bookingsByStatus = Array.from(byStatusMap.entries()).map(
        ([status, count]) => ({ status, count })
      );

      // Busiest day
      const busiestDay =
        bookingsByDay.length > 0
          ? bookingsByDay.reduce((a, b) => (a.count > b.count ? a : b)).date
          : null;

      // Busiest time slot
      const byTimeMap = new Map<string, number>();
      for (const b of bookings) {
        byTimeMap.set(b.slot.startTime, (byTimeMap.get(b.slot.startTime) ?? 0) + 1);
      }
      const busiestTimeSlot =
        byTimeMap.size > 0
          ? Array.from(byTimeMap.entries()).reduce((a, b) =>
              a[1] > b[1] ? a : b
            )[0]
          : null;

      // New vs returning customers
      const userIds = [...new Set(bookings.map((b) => b.userId))];
      let newCustomers = 0;
      let returningCustomers = 0;

      if (userIds.length > 0) {
        const usersWithEarlierBookings = await ctx.prisma.booking.findMany({
          where: {
            userId: { in: userIds },
            slot: { date: { lt: start } },
          },
          select: { userId: true },
          distinct: ["userId"],
        });
        const returningSet = new Set(usersWithEarlierBookings.map((b) => b.userId));
        returningCustomers = returningSet.size;
        newCustomers = userIds.length - returningCustomers;
      }

      return {
        totalBookings,
        completedBookings,
        cancelledBookings,
        noShowCount,
        newCustomers,
        returningCustomers,
        busiestDay,
        busiestTimeSlot,
        bookingsByDay,
        bookingsByStatus,
      };
    }),
});
