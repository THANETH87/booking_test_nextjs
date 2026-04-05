import { streamText, convertToModelMessages } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { getTokenFromCookieHeader, verifyToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  // 1. Authenticate
  const token = getTokenFromCookieHeader(req.headers);
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }
  const payload = await verifyToken(token);
  if (!payload) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Parse body
  const { messages, mode = "general" } = await req.json();

  // 3. Build booking context if needed
  let bookingContext = "";
  if (mode === "booking") {
    try {
      const now = new Date();
      const next7days = new Date(now);
      next7days.setDate(now.getDate() + 7);
      const next30days = new Date(now);
      next30days.setDate(now.getDate() + 30);

      const [user, userBookings, holidays, availableSlots] = await Promise.all([
        prisma.user.findUnique({
          where: { id: payload.userId },
          select: { firstName: true, lastName: true },
        }),
        prisma.booking.findMany({
          where: {
            userId: payload.userId,
            status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
          },
          include: { slot: true },
          orderBy: { slot: { date: "asc" } },
        }),
        prisma.shopHoliday.findMany({
          where: { date: { gte: now, lte: next30days } },
          orderBy: { date: "asc" },
        }),
        prisma.timeSlot.findMany({
          where: {
            date: { gte: now, lte: next7days },
            isBlocked: false,
            bookings: { none: { status: { notIn: ["CANCELLED"] } } },
            guestBookings: { none: { status: { notIn: ["CANCELLED"] } } },
          },
          orderBy: [{ date: "asc" }, { startTime: "asc" }],
          take: 50,
        }),
      ]);

      bookingContext += `\nผู้ใช้ปัจจุบัน: ${user?.firstName ?? ""} ${user?.lastName ?? ""}`;

      bookingContext += `\n\n--- การจองของผู้ใช้ ---\n`;
      if (userBookings.length > 0) {
        bookingContext += userBookings
          .map(
            (b) =>
              `- การจอง #${b.id}: ${b.slot.date.toISOString().split("T")[0]} เวลา ${b.slot.startTime}-${b.slot.endTime} สถานะ: ${b.status}`
          )
          .join("\n");
      } else {
        bookingContext += "ไม่มีการจองที่กำลังดำเนินอยู่";
      }

      if (holidays.length > 0) {
        bookingContext += `\n\n--- วันหยุดร้าน ---\n`;
        bookingContext += holidays
          .map(
            (h) =>
              `- ${h.date.toISOString().split("T")[0]}${h.reason ? `: ${h.reason}` : ""}`
          )
          .join("\n");
      }

      bookingContext += `\n\n--- ช่วงเวลาว่าง (7 วันข้างหน้า) ---\n`;
      if (availableSlots.length > 0) {
        const grouped: Record<string, string[]> = {};
        for (const s of availableSlots) {
          const d = s.date.toISOString().split("T")[0];
          if (!grouped[d]) grouped[d] = [];
          grouped[d].push(`${s.startTime}-${s.endTime}`);
        }
        for (const [date, times] of Object.entries(grouped)) {
          bookingContext += `- ${date}: ${times.join(", ")}\n`;
        }
      } else {
        bookingContext += "ไม่มีช่วงเวลาว่างใน 7 วันข้างหน้า";
      }
    } catch {
      bookingContext = "\n(ไม่สามารถโหลดข้อมูลการจองได้ในขณะนี้)";
    }
  }

  // 4. System prompt
  const systemPrompt = `คุณเป็นผู้ช่วย AI ของร้านทำผม SalonQ คุณช่วยตอบคำถามเกี่ยวกับบริการร้าน การจองคิว และให้ข้อมูลทั่วไป

ข้อมูลร้าน:
- ชื่อร้าน: SalonQ
- เวลาเปิด-ปิด: 09:00-20:00
- บริการ: ตัดผม, ย้อมผม, ทำสี, ไดร์ผม, ทรีตเมนต์
- แต่ละช่วงเวลา (slot) ใช้เวลา 30 นาที
- ผู้ใช้สามารถจองผ่านหน้า /book และดูการจองที่ /my-bookings
- ยกเลิกการจองได้ที่หน้า /my-bookings
${bookingContext}

กฎ:
- ตอบเป็นภาษาไทยเสมอ
- ตอบสั้น กระชับ เป็นมิตร
- คุณไม่สามารถจอง ยกเลิก หรือเลื่อนนัดให้ผู้ใช้ได้โดยตรง ให้แนะนำผู้ใช้ไปที่หน้าที่เหมาะสมแทน
- ถ้าผู้ใช้ถามนอกเหนือจากเรื่องร้าน ให้ตอบได้ตามปกติอย่างเป็นมิตร`;

  // 5. Convert UIMessages to model messages and stream response
  const modelMessages = await convertToModelMessages(messages);
  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
