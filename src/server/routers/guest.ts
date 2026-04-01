import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../trpc";
import { createGuestBookingSchema, cancelGuestBookingSchema } from "@/lib/validators";
import { sendEmail } from "@/lib/email";
import { guestBookingConfirmation, bookingStatusChanged } from "@/lib/email-templates";
import { notifyNextInWaitlist } from "@/lib/waitlist-notify";

const MAX_BOOKINGS_PER_DAY = 20;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const guestRouter = router({
  create: publicProcedure
    .input(createGuestBookingSchema)
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

      // Check not in past
      const now = new Date();
      const slotDateStr = slot.date.toISOString().split("T")[0];
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      if (slotDateStr < todayStr) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot book past slot" });
      }

      // Check not double-booked (both tables)
      const existingBooking = await ctx.prisma.booking.findFirst({
        where: { slotId: input.slotId, status: { notIn: ["CANCELLED"] } },
      });
      if (existingBooking) {
        throw new TRPCError({ code: "CONFLICT", message: "Slot already booked" });
      }

      const existingGuest = await ctx.prisma.guestBooking.findFirst({
        where: { slotId: input.slotId, status: { notIn: ["CANCELLED"] } },
      });
      if (existingGuest) {
        throw new TRPCError({ code: "CONFLICT", message: "Slot already booked" });
      }

      // Check daily limit (both tables)
      const [bookingCount, guestCount] = await Promise.all([
        ctx.prisma.booking.count({
          where: { slot: { date: slot.date }, status: { notIn: ["CANCELLED"] } },
        }),
        ctx.prisma.guestBooking.count({
          where: { slot: { date: slot.date }, status: { notIn: ["CANCELLED"] } },
        }),
      ]);

      if (bookingCount + guestCount >= MAX_BOOKINGS_PER_DAY) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Max bookings for this day reached" });
      }

      const guestBooking = await ctx.prisma.guestBooking.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          slotId: input.slotId,
          note: input.note,
        },
        include: { slot: true },
      });

      // Send confirmation email
      const dateStr = slot.date.toISOString().split("T")[0];
      const cancelUrl = `${baseUrl}/cancel?token=${guestBooking.cancelToken}`;
      const tmpl = guestBookingConfirmation(
        input.firstName,
        dateStr,
        slot.startTime,
        slot.endTime,
        cancelUrl
      );
      sendEmail(input.email, tmpl.subject, tmpl.html);

      return { id: guestBooking.id, cancelToken: guestBooking.cancelToken };
    }),

  cancelByToken: publicProcedure
    .input(cancelGuestBookingSchema)
    .mutation(async ({ ctx, input }) => {
      const guestBooking = await ctx.prisma.guestBooking.findUnique({
        where: { cancelToken: input.cancelToken },
        include: { slot: true },
      });

      if (!guestBooking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      }

      if (guestBooking.status === "CANCELLED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Already cancelled" });
      }

      await ctx.prisma.guestBooking.update({
        where: { id: guestBooking.id },
        data: { status: "CANCELLED" },
      });

      // Notify waitlist
      notifyNextInWaitlist(ctx.prisma, guestBooking.slotId);

      // Send cancellation email
      const dateStr = guestBooking.slot.date.toISOString().split("T")[0];
      const tmpl = bookingStatusChanged(
        guestBooking.firstName,
        "CANCELLED",
        dateStr,
        guestBooking.slot.startTime,
        guestBooking.slot.endTime
      );
      sendEmail(guestBooking.email, tmpl.subject, tmpl.html);

      return { success: true };
    }),
});
