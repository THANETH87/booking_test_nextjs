"use client";

interface BookingCardProps {
  booking: {
    id: number;
    status: string;
    note: string | null;
    createdAt: Date;
    slot: {
      date: Date;
      startTime: string;
      endTime: string;
    };
  };
  onCancel?: (bookingId: number) => void;
  isCancelling?: boolean;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  IN_PROGRESS: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function BookingCard({ booking, onCancel, isCancelling }: BookingCardProps) {
  const canCancel = ["PENDING", "CONFIRMED"].includes(booking.status);
  const date = new Date(booking.slot.date);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {booking.slot.startTime} - {booking.slot.endTime}
            </span>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[booking.status] ?? ""}`}
            >
              {statusLabels[booking.status] ?? booking.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {date.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          {booking.note && (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Note: {booking.note}
            </p>
          )}
        </div>
        {canCancel && onCancel && (
          <button
            onClick={() => onCancel(booking.id)}
            disabled={isCancelling}
            className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          >
            {isCancelling ? "Cancelling..." : "Cancel"}
          </button>
        )}
      </div>
    </div>
  );
}
