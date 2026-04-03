"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useToast } from "./Toast";
import { DatePicker } from "./DatePicker";
import { SlotGrid } from "./SlotGrid";

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  currentSlotId: number;
}

export function RescheduleModal({
  isOpen,
  onClose,
  bookingId,
  currentSlotId,
}: RescheduleModalProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);

  const holidaysQuery = trpc.slot.getHolidayDates.useQuery();
  const slotsQuery = trpc.slot.getAvailable.useQuery(
    { date: selectedDate! },
    { enabled: !!selectedDate }
  );

  const rescheduleMutation = trpc.booking.reschedule.useMutation({
    onSuccess: () => {
      toast("เลื่อนนัดสำเร็จ!", "success");
      utils.booking.getMyBookings.invalidate();
      onClose();
    },
    onError: (err) => toast(err.message, "error"),
  });

  if (!isOpen) return null;

  const holidays = holidaysQuery.data?.map((h) => h.date) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 glass" onClick={onClose} />
      <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">เลื่อนนัดหมาย</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-secondary"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <p className="mb-3 text-sm font-medium text-muted">เลือกวันใหม่</p>
          <DatePicker selectedDate={selectedDate} onSelect={(d) => { setSelectedDate(d); setSelectedSlotId(null); }} holidays={holidays} />
        </div>

        {selectedDate && (
          <div className="mb-6">
            <p className="mb-3 text-sm font-medium text-muted">เลือกเวลาใหม่</p>
            <SlotGrid
              slots={(slotsQuery.data ?? []).filter((s) => s.id !== currentSlotId)}
              selectedSlotId={selectedSlotId}
              onSelect={setSelectedSlotId}
              isLoading={slotsQuery.isLoading}
            />
          </div>
        )}

        {selectedSlotId && (
          <button
            onClick={() => rescheduleMutation.mutate({ bookingId, newSlotId: selectedSlotId })}
            disabled={rescheduleMutation.isPending}
            className="w-full rounded-xl gradient-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-50"
          >
            {rescheduleMutation.isPending ? "กำลังเลื่อนนัด..." : "ยืนยันเลื่อนนัด"}
          </button>
        )}
      </div>
    </div>
  );
}
