const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

function layout(content: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#faf9f7;font-family:system-ui,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#8b5cf6,#6d28d9);padding:24px 32px;">
      <h1 style="margin:0;color:#fff;font-size:20px;">SalonQ</h1>
    </div>
    <div style="padding:32px;">
      ${content}
    </div>
    <div style="padding:16px 32px;background:#f5f3ff;text-align:center;font-size:12px;color:#6b7280;">
      SalonQ &mdash; ระบบจองคิวร้านทำผม
    </div>
  </div>
</body>
</html>`;
}

function detailsBlock(date: string, startTime: string, endTime: string) {
  return `
    <div style="background:#f5f3ff;border-radius:12px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 4px;font-size:14px;color:#6b7280;">วันที่</p>
      <p style="margin:0 0 12px;font-size:16px;font-weight:600;color:#1a1a1a;">${date}</p>
      <p style="margin:0 0 4px;font-size:14px;color:#6b7280;">เวลา</p>
      <p style="margin:0;font-size:16px;font-weight:600;color:#8b5cf6;">${startTime} - ${endTime}</p>
    </div>`;
}

export function bookingConfirmation(name: string, date: string, startTime: string, endTime: string) {
  return {
    subject: `ยืนยันการจอง — ${date} ${startTime}`,
    html: layout(`
      <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:18px;">สวัสดีค่ะ ${name}</h2>
      <p style="margin:0 0 16px;color:#6b7280;">การจองของคุณได้รับแล้ว</p>
      ${detailsBlock(date, startTime, endTime)}
      <a href="${baseUrl}/my-bookings" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#8b5cf6;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">ดูการจองของฉัน</a>
    `),
  };
}

export function bookingStatusChanged(name: string, status: string, date: string, startTime: string, endTime: string) {
  const statusTh: Record<string, string> = {
    CONFIRMED: "ได้รับการยืนยันแล้ว",
    CANCELLED: "ถูกยกเลิก",
    IN_PROGRESS: "กำลังดำเนินการ",
    COMPLETED: "เสร็จสิ้น",
  };

  return {
    subject: `นัดหมายของคุณ${statusTh[status] ?? status}`,
    html: layout(`
      <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:18px;">สวัสดีค่ะ ${name}</h2>
      <p style="margin:0 0 16px;color:#6b7280;">สถานะนัดหมายของคุณเปลี่ยนเป็น: <strong>${statusTh[status] ?? status}</strong></p>
      ${detailsBlock(date, startTime, endTime)}
      ${status === "CANCELLED" ? `<a href="${baseUrl}/book" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#8b5cf6;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">จองใหม่</a>` : ""}
    `),
  };
}

export function bookingReminder(name: string, date: string, startTime: string, endTime: string) {
  return {
    subject: `แจ้งเตือน: นัดพรุ่งนี้ ${startTime}`,
    html: layout(`
      <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:18px;">สวัสดีค่ะ ${name}</h2>
      <p style="margin:0 0 16px;color:#6b7280;">เตือนว่าคุณมีนัดพรุ่งนี้</p>
      ${detailsBlock(date, startTime, endTime)}
      <a href="${baseUrl}/my-bookings" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#8b5cf6;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">ดูการจองของฉัน</a>
    `),
  };
}

export function guestBookingConfirmation(name: string, date: string, startTime: string, endTime: string, cancelUrl: string) {
  return {
    subject: `ยืนยันการจอง — ${date} ${startTime}`,
    html: layout(`
      <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:18px;">สวัสดีค่ะ ${name}</h2>
      <p style="margin:0 0 16px;color:#6b7280;">การจองของคุณได้รับแล้ว</p>
      ${detailsBlock(date, startTime, endTime)}
      <p style="margin:16px 0 8px;font-size:13px;color:#6b7280;">หากต้องการยกเลิก:</p>
      <a href="${cancelUrl}" style="display:inline-block;padding:10px 24px;background:#ef4444;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">ยกเลิกการจอง</a>
      <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">สมัครสมาชิกเพื่อจัดการนัดหมายได้สะดวกยิ่งขึ้น → <a href="${baseUrl}/register" style="color:#8b5cf6;">สมัครเลย</a></p>
    `),
  };
}

export function waitlistNotification(name: string, date: string, startTime: string, endTime: string) {
  return {
    subject: `มีคิวว่างแล้ว! ${date} ${startTime}`,
    html: layout(`
      <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:18px;">สวัสดีค่ะ ${name}</h2>
      <p style="margin:0 0 16px;color:#6b7280;">คิวที่คุณรอมีว่างแล้ว! รีบจองก่อนหมดนะคะ</p>
      ${detailsBlock(date, startTime, endTime)}
      <a href="${baseUrl}/book" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#8b5cf6;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">จองเลย</a>
    `),
  };
}

export function rescheduleConfirmation(name: string, oldDate: string, oldTime: string, newDate: string, newTime: string) {
  return {
    subject: `เลื่อนนัดสำเร็จ — ${newDate} ${newTime}`,
    html: layout(`
      <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:18px;">สวัสดีค่ะ ${name}</h2>
      <p style="margin:0 0 16px;color:#6b7280;">นัดหมายของคุณเลื่อนเรียบร้อยแล้ว</p>
      <div style="background:#fef2f2;border-radius:12px;padding:12px 16px;margin:12px 0;">
        <p style="margin:0;font-size:13px;color:#6b7280;">เดิม: <s>${oldDate} ${oldTime}</s></p>
      </div>
      <div style="background:#f0fdf4;border-radius:12px;padding:12px 16px;margin:12px 0;">
        <p style="margin:0;font-size:14px;font-weight:600;color:#16a34a;">ใหม่: ${newDate} ${newTime}</p>
      </div>
      <a href="${baseUrl}/my-bookings" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#8b5cf6;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">ดูการจองของฉัน</a>
    `),
  };
}
