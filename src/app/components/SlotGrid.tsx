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
  onJoinWaitlist?: (slotId: number) => void;
  isLoading?: boolean;
}

export function SlotGrid({
  slots,
  selectedSlotId,
  onSelect,
  onJoinWaitlist,
  isLoading,
}: SlotGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 22 }).map((_, i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-xl bg-border/50"
          />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface-secondary p-8 text-center">
        <p className="text-sm text-muted">No slots available for this date.</p>
      </div>
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
            className={`rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-all ${
              selected
                ? "border-primary bg-primary text-white shadow-lg shadow-primary/25 scale-[1.02]"
                : disabled
                  ? slot.isBlocked
                    ? "cursor-not-allowed border-red-200 bg-red-50 text-red-300 dark:border-red-900 dark:bg-red-950/50 dark:text-red-700"
                    : "cursor-not-allowed border-transparent bg-surface-secondary text-foreground/25"
                  : "border-transparent bg-surface text-foreground shadow-sm hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
            }`}
          >
            {slot.startTime}
            {slot.isBooked && !slot.isBlocked && !slot.isPast && onJoinWaitlist && (
              <span
                onClick={(e) => { e.stopPropagation(); onJoinWaitlist(slot.id); }}
                className="mt-1 block cursor-pointer text-[10px] font-medium text-primary hover:underline"
              >
                Waitlist
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
