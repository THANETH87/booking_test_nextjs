"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/app/components/Toast";
import { BookingCard } from "@/app/components/BookingCard";
import { RescheduleModal } from "@/app/components/RescheduleModal";

export default function MyBookingsPage() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [reschedule, setReschedule] = useState<{ bookingId: number; slotId: number } | null>(null);

  const bookingsQuery = trpc.booking.getMyBookings.useQuery();

  const cancelMutation = trpc.booking.cancel.useMutation({
    onSuccess: () => {
      toast("ยกเลิกการจองแล้ว", "success");
      utils.booking.getMyBookings.invalidate();
    },
    onError: (err) => {
      toast(err.message, "error");
    },
  });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">การจองของฉัน</h1>
          <p className="mt-1 text-muted">ติดตามและจัดการนัดหมายของคุณ</p>
        </div>
        <Link
          href="/book"
          className="rounded-xl gradient-primary px-4 py-2 text-sm font-medium text-white shadow-md shadow-primary/25 transition-all hover:shadow-lg"
        >
          + จองใหม่
        </Link>
      </div>

      {bookingsQuery.isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-border/30" />
          ))}
        </div>
      ) : bookingsQuery.data?.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface-secondary py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-foreground font-medium">ยังไม่มีการจอง</p>
          <p className="mt-1 text-sm text-muted">จองนัดหมายแรกของคุณวันนี้!</p>
          <Link
            href="/book"
            className="mt-4 inline-block rounded-xl gradient-primary px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-primary/25"
          >
            จองเลย
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {bookingsQuery.data?.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancel={(id) => cancelMutation.mutate({ bookingId: id })}
              onReschedule={(id, slotId) => setReschedule({ bookingId: id, slotId })}
              isCancelling={cancelMutation.isPending}
            />
          ))}
        </div>
      )}

      {reschedule && (
        <RescheduleModal
          isOpen
          onClose={() => setReschedule(null)}
          bookingId={reschedule.bookingId}
          currentSlotId={reschedule.slotId}
        />
      )}
    </div>
  );
}
