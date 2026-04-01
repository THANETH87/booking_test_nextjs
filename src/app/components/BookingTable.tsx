"use client";

interface BookingRow {
  id: number;
  status: string;
  note: string | null;
  createdAt: Date;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  slot: {
    date: Date;
    startTime: string;
    endTime: string;
  };
}

interface BookingTableProps {
  bookings: BookingRow[];
  onUpdateStatus: (bookingId: number, status: string) => void;
  isUpdating?: boolean;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  IN_PROGRESS: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const nextStatus: Record<string, { label: string; value: string }[]> = {
  PENDING: [
    { label: "Confirm", value: "CONFIRMED" },
    { label: "Cancel", value: "CANCELLED" },
  ],
  CONFIRMED: [
    { label: "Start", value: "IN_PROGRESS" },
    { label: "Cancel", value: "CANCELLED" },
  ],
  IN_PROGRESS: [
    { label: "Complete", value: "COMPLETED" },
    { label: "Cancel", value: "CANCELLED" },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

export function BookingTable({
  bookings,
  onUpdateStatus,
  isUpdating,
}: BookingTableProps) {
  if (bookings.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        No bookings found.
      </p>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700">
              <th className="px-3 py-2 font-medium text-zinc-500 dark:text-zinc-400">ID</th>
              <th className="px-3 py-2 font-medium text-zinc-500 dark:text-zinc-400">Customer</th>
              <th className="px-3 py-2 font-medium text-zinc-500 dark:text-zinc-400">Date</th>
              <th className="px-3 py-2 font-medium text-zinc-500 dark:text-zinc-400">Time</th>
              <th className="px-3 py-2 font-medium text-zinc-500 dark:text-zinc-400">Status</th>
              <th className="px-3 py-2 font-medium text-zinc-500 dark:text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr
                key={b.id}
                className="border-b border-zinc-100 dark:border-zinc-800"
              >
                <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100">
                  #{b.id}
                </td>
                <td className="px-3 py-2">
                  <div className="text-zinc-900 dark:text-zinc-100">
                    {b.user.firstName} {b.user.lastName}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {b.user.phone}
                  </div>
                </td>
                <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                  {new Date(b.slot.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                  {b.slot.startTime} - {b.slot.endTime}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[b.status] ?? ""}`}
                  >
                    {b.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    {(nextStatus[b.status] ?? []).map((action) => (
                      <button
                        key={action.value}
                        onClick={() => onUpdateStatus(b.id, action.value)}
                        disabled={isUpdating}
                        className={`rounded px-2 py-1 text-xs font-medium disabled:opacity-50 ${
                          action.value === "CANCELLED"
                            ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300"
                        }`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="flex flex-col gap-3 md:hidden">
        {bookings.map((b) => (
          <div
            key={b.id}
            className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                #{b.id} — {b.user.firstName} {b.user.lastName}
              </span>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[b.status] ?? ""}`}
              >
                {b.status.replace("_", " ")}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {new Date(b.slot.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
              &middot; {b.slot.startTime} - {b.slot.endTime}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {b.user.phone}
            </p>
            {(nextStatus[b.status] ?? []).length > 0 && (
              <div className="mt-3 flex gap-2">
                {(nextStatus[b.status] ?? []).map((action) => (
                  <button
                    key={action.value}
                    onClick={() => onUpdateStatus(b.id, action.value)}
                    disabled={isUpdating}
                    className={`rounded px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
                      action.value === "CANCELLED"
                        ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
