import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { bookingReminder } from "@/lib/email-templates";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const bookings = await prisma.booking.findMany({
    where: {
      slot: { date: { gte: tomorrow, lt: dayAfter } },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    include: {
      user: { select: { email: true, firstName: true } },
      slot: { select: { date: true, startTime: true, endTime: true } },
    },
  });

  let sent = 0;
  for (const b of bookings) {
    const dateStr = b.slot.date.toISOString().split("T")[0];
    const tmpl = bookingReminder(b.user.firstName, dateStr, b.slot.startTime, b.slot.endTime);
    await sendEmail(b.user.email, tmpl.subject, tmpl.html);
    sent++;
  }

  return NextResponse.json({ sent });
}
