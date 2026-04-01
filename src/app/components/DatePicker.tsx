"use client";

interface DatePickerProps {
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

export function DatePicker({ selectedDate, onSelect }: DatePickerProps) {
  const dates: { label: string; value: string; dayName: string }[] = [];

  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = d.toISOString().split("T")[0];
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    dates.push({ label, value, dayName });
  }

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
      {dates.map((d) => (
        <button
          key={d.value}
          onClick={() => onSelect(d.value)}
          className={`flex flex-col items-center rounded-lg border px-3 py-2 text-sm transition-colors ${
            selectedDate === d.value
              ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
              : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-500"
          }`}
        >
          <span className="text-xs font-medium">{d.dayName}</span>
          <span className="font-semibold">{d.label}</span>
        </button>
      ))}
    </div>
  );
}
