"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/app/components/Toast";
import { DatePicker } from "@/app/components/DatePicker";
import { SlotGrid } from "@/app/components/SlotGrid";

export default function BookPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const slotsQuery = trpc.slot.getAvailable.useQuery(
    { date: selectedDate! },
    { enabled: !!selectedDate }
  );

  const bookMutation = trpc.booking.create.useMutation({
    onSuccess: () => {
      toast("Booking confirmed!", "success");
      router.push("/my-bookings");
    },
    onError: (err) => {
      toast(err.message, "error");
    },
  });

  const selectedSlot = slotsQuery.data?.find((s) => s.id === selectedSlotId);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedSlotId(null);
    setShowConfirm(false);
  };

  const handleSlotSelect = (slotId: number) => {
    setSelectedSlotId(slotId);
    setShowConfirm(true);
  };

  const handleBook = () => {
    if (!selectedSlotId) return;
    bookMutation.mutate({
      slotId: selectedSlotId,
      note: note.trim() || undefined,
    });
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Book an Appointment
      </h1>

      {/* Step 1: Select date */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          1. Select a date
        </h2>
        <DatePicker selectedDate={selectedDate} onSelect={handleDateSelect} />
      </div>

      {/* Step 2: Select time slot */}
      {selectedDate && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            2. Select a time
          </h2>
          <div className="mb-2 flex gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded border border-green-300 bg-green-50" />{" "}
              Available
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded border border-zinc-300 bg-zinc-100" />{" "}
              Booked
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded border border-red-300 bg-red-50" />{" "}
              Blocked
            </span>
          </div>
          <SlotGrid
            slots={slotsQuery.data ?? []}
            selectedSlotId={selectedSlotId}
            onSelect={handleSlotSelect}
            isLoading={slotsQuery.isLoading}
          />
        </div>
      )}

      {/* Step 3: Confirm */}
      {showConfirm && selectedSlot && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            3. Confirm your booking
          </h2>
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-zinc-900 px-4 py-2 text-white dark:bg-zinc-50 dark:text-zinc-900">
              <span className="text-lg font-bold">{selectedSlot.startTime}</span>
              <span className="mx-1 text-sm">-</span>
              <span className="text-lg font-bold">{selectedSlot.endTime}</span>
            </div>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="mb-4">
            <label
              htmlFor="note"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Note (optional)
            </label>
            <input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              placeholder="Any special requests..."
            />
          </div>
          <button
            onClick={handleBook}
            disabled={bookMutation.isPending}
            className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {bookMutation.isPending ? "Booking..." : "Confirm Booking"}
          </button>
        </div>
      )}
    </div>
  );
}
