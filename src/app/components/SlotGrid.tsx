"use client";

interface Slot {
  id: number;
  startTime: string;
  endTime: string;
  isBlocked: boolean;
  isBooked: boolean;
  isPast: boolean;
}

interface SlotGridProps {
  slots: Slot[];
  selectedSlotId: number | null;
  onSelect: (slotId: number) => void;
  isLoading?: boolean;
}

export function SlotGrid({
  slots,
  selectedSlotId,
  onSelect,
  isLoading,
}: SlotGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 22 }).map((_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800"
          />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        No slots available for this date.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {slots.map((slot) => {
        const disabled = slot.isBlocked || slot.isBooked || slot.isPast;
        const selected = selectedSlotId === slot.id;

        return (
          <button
            key={slot.id}
            onClick={() => !disabled && onSelect(slot.id)}
            disabled={disabled}
            className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
              selected
                ? "border-green-600 bg-green-600 text-white"
                : disabled
                  ? slot.isBlocked
                    ? "cursor-not-allowed border-red-200 bg-red-50 text-red-400 dark:border-red-900 dark:bg-red-950 dark:text-red-600"
                    : "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-600"
                  : "border-green-200 bg-green-50 text-green-700 hover:border-green-400 hover:bg-green-100 dark:border-green-900 dark:bg-green-950 dark:text-green-400 dark:hover:border-green-700"
            }`}
          >
            {slot.startTime}
          </button>
        );
      })}
    </div>
  );
}
