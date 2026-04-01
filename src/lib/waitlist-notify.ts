import type { PrismaClient } from "@/generated/prisma/client";
import { sendEmail } from "./email";
import { waitlistNotification } from "./email-templates";

export async function notifyNextInWaitlist(
  prisma: PrismaClient,
  slotId: number
): Promise<void> {
  try {
    const entry = await prisma.waitlist.findFirst({
      where: { slotId, notified: false },
      orderBy: { position: "asc" },
      include: {
        user: { select: { email: true, firstName: true } },
        slot: { select: { date: true, startTime: true, endTime: true } },
      },
    });

    if (!entry) return;

    await prisma.waitlist.update({
      where: { id: entry.id },
      data: { notified: true },
    });

    const dateStr = entry.slot.date.toISOString().split("T")[0];
    const tmpl = waitlistNotification(
      entry.user.firstName,
      dateStr,
      entry.slot.startTime,
      entry.slot.endTime
    );

    sendEmail(entry.user.email, tmpl.subject, tmpl.html);
  } catch (err) {
    console.error("[Waitlist notify error]", err);
  }
}
