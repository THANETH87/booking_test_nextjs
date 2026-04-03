"use client";

interface BookingCardProps {
  booking: {
    id: number;
    status: string;
    note: string | null;
    rescheduledAt?: Date | null;
    createdAt: Date;
    slot: {
      id: number;
      date: Date;
      startTime: string;
      endTime: string;
    };
  };
  onCancel?: (bookingId: number) => void;
  onReschedule?: (bookingId: number, slotId: number) => void;
  isCancelling?: boolean;
}

const statusConfig: Record<string, { color: string; bg: string; icon: string }> = {
  PENDING: { color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800", icon: "M12 8v4l3 3" },
  CONFIRMED: { color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800", icon: "M5 13l4 4L19 7" },
  IN_PROGRESS: { color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-50 border-orange-200 dark:bg-orange-950/50 dark:border-orange-800", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  COMPLETED: { color: "text-green-700 dark:text-green-300", bg: "bg-green-50 border-green-200 dark:bg-green-950/50 dark:border-green-800", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  CANCELLED: { color: "text-red-700 dark:text-red-300", bg: "bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800", icon: "M6 18L18 6M6 6l12 12" },
};

const statusLabels: Record<string, string> = {
  PENDING: "รอดำเนินการ",
  CONFIRMED: "ยืนยันแล้ว",
  IN_PROGRESS: "กำลังดำเนินการ",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิกแล้ว",
};

export function BookingCard({ booking, onCancel, onReschedule, isCancelling }: BookingCardProps) {
  const canCancel = ["PENDING", "CONFIRMED"].includes(booking.status);
  const canReschedule = canCancel && !booking.rescheduledAt;
  const date = new Date(booking.slot.date);
  const config = statusConfig[booking.status] ?? statusConfig.PENDING;

  return (
    <div className={`rounded-2xl border p-5 transition-all ${config.bg}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-20 items-center justify-center rounded-xl bg-white/80 dark:bg-black/20">
              <span className="text-lg font-bold text-foreground">
                {booking.slot.startTime}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {booking.slot.startTime} - {booking.slot.endTime}
              </p>
              <p className="text-sm text-muted">
                {date.toLocaleDateString("th-TH", {
                  weekday: "short",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.color}`}>
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
              </svg>
              {statusLabels[booking.status] ?? booking.status}
            </span>
          </div>
          {booking.note && (
            <p className="mt-2 text-sm text-muted italic">
              &ldquo;{booking.note}&rdquo;
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          {canReschedule && onReschedule && (
            <button
              onClick={() => onReschedule(booking.id, booking.slot.id)}
              className="rounded-xl border border-primary/30 bg-white px-4 py-2 text-sm font-medium text-primary shadow-sm transition-all hover:bg-primary/5 hover:shadow-md dark:border-primary/50 dark:bg-primary/10"
            >
              เลื่อนนัด
            </button>
          )}
          {canCancel && onCancel && (
            <button
              onClick={() => onCancel(booking.id)}
              disabled={isCancelling}
              className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm transition-all hover:bg-red-50 hover:shadow-md disabled:opacity-50 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
            >
              {isCancelling ? "..." : "ยกเลิก"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
