"use client";

interface DatePickerProps {
  selectedDate: string | null;
  onSelect: (date: string) => void;
  holidays?: string[];
}

export function DatePicker({ selectedDate, onSelect, holidays = [] }: DatePickerProps) {
  const dates: { label: string; value: string; dayName: string; isToday: boolean }[] = [];

  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = d.toISOString().split("T")[0];
    const dayName = d.toLocaleDateString("th-TH", { weekday: "short" });
    const label = d.toLocaleDateString("th-TH", { day: "numeric" });
    dates.push({ label, value, dayName, isToday: i === 0 });
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {dates.map((d) => (
        <button
          key={d.value}
          onClick={() => !holidays.includes(d.value) && onSelect(d.value)}
          disabled={holidays.includes(d.value)}
          className={`flex shrink-0 flex-col items-center rounded-2xl border-2 px-4 py-3 transition-all ${
            holidays.includes(d.value)
              ? "cursor-not-allowed border-red-200 bg-red-50 text-red-400 dark:border-red-900 dark:bg-red-950/50 dark:text-red-600"
              : selectedDate === d.value
                ? "border-primary bg-primary text-white shadow-lg shadow-primary/25"
                : "border-transparent bg-surface text-foreground/70 shadow-sm hover:border-primary/30 hover:shadow-md"
          }`}
        >
          <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">
            {d.dayName}
          </span>
          <span className="text-xl font-bold">{d.label}</span>
          {holidays.includes(d.value) ? (
            <span className="mt-0.5 text-[10px] font-medium text-red-500">ปิด</span>
          ) : d.isToday ? (
            <span className={`mt-0.5 text-[10px] font-medium ${selectedDate === d.value ? "text-white/80" : "text-primary"}`}>
              วันนี้
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
