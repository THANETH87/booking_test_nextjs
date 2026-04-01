"use client";

import { trpc } from "@/lib/trpc";
import { useToast } from "@/app/components/Toast";
import { BookingCard } from "@/app/components/BookingCard";

export default function MyBookingsPage() {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const bookingsQuery = trpc.booking.getMyBookings.useQuery();

  const cancelMutation = trpc.booking.cancel.useMutation({
    onSuccess: () => {
      toast("Booking cancelled", "success");
      utils.booking.getMyBookings.invalidate();
    },
    onError: (err) => {
      toast(err.message, "error");
    },
  });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        My Bookings
      </h1>

      {bookingsQuery.isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
      ) : bookingsQuery.data?.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-zinc-500 dark:text-zinc-400">
            You don&apos;t have any bookings yet.
          </p>
          <a
            href="/book"
            className="mt-3 inline-block text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50"
          >
            Book an appointment
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {bookingsQuery.data?.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancel={(id) => cancelMutation.mutate({ bookingId: id })}
              isCancelling={cancelMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
