import { router, adminProcedure } from "../trpc";

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
});
