"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/app/components/Toast";
import { BookingTable } from "@/app/components/BookingTable";

const STATUSES = ["ALL", "PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

export default function AdminBookingsPage() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [status, setStatus] = useState<string>("ALL");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);

  const bookingsQuery = trpc.booking.getAll.useQuery({
    status: status === "ALL" ? undefined : (status as "PENDING"),
    date: date || undefined,
    page,
    limit: 20,
  });

  const updateStatusMutation = trpc.booking.updateStatus.useMutation({
    onSuccess: () => {
      toast("Status updated", "success");
      utils.booking.getAll.invalidate();
    },
    onError: (err) => {
      toast(err.message, "error");
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        All Bookings
      </h1>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "ALL" ? "All Statuses" : s.replace("_", " ")}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
        {date && (
          <button
            onClick={() => {
              setDate("");
              setPage(1);
            }}
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
          >
            Clear date
          </button>
        )}
      </div>

      {bookingsQuery.isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
      ) : (
        <>
          <BookingTable
            bookings={(bookingsQuery.data?.bookings as never[]) ?? []}
            onUpdateStatus={(id, s) =>
              updateStatusMutation.mutate({
                bookingId: id,
                status: s as "PENDING",
              })
            }
            isUpdating={updateStatusMutation.isPending}
          />

          {/* Pagination */}
          {bookingsQuery.data && bookingsQuery.data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-600"
              >
                Previous
              </button>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Page {page} of {bookingsQuery.data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= bookingsQuery.data.totalPages}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-600"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
