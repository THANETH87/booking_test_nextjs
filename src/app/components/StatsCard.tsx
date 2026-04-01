interface StatsCardProps {
  title: string;
  value: number;
  color?: "default" | "yellow" | "blue" | "orange" | "green" | "red" | "purple";
  icon?: string;
}

const colorMap: Record<string, { border: string; bg: string; iconBg: string; text: string }> = {
  default: { border: "border-border", bg: "bg-surface", iconBg: "bg-primary/10", text: "text-primary" },
  yellow: { border: "border-amber-200 dark:border-amber-800", bg: "bg-amber-50 dark:bg-amber-950/50", iconBg: "bg-amber-100 dark:bg-amber-900", text: "text-amber-600 dark:text-amber-400" },
  blue: { border: "border-blue-200 dark:border-blue-800", bg: "bg-blue-50 dark:bg-blue-950/50", iconBg: "bg-blue-100 dark:bg-blue-900", text: "text-blue-600 dark:text-blue-400" },
  orange: { border: "border-orange-200 dark:border-orange-800", bg: "bg-orange-50 dark:bg-orange-950/50", iconBg: "bg-orange-100 dark:bg-orange-900", text: "text-orange-600 dark:text-orange-400" },
  green: { border: "border-green-200 dark:border-green-800", bg: "bg-green-50 dark:bg-green-950/50", iconBg: "bg-green-100 dark:bg-green-900", text: "text-green-600 dark:text-green-400" },
  red: { border: "border-red-200 dark:border-red-800", bg: "bg-red-50 dark:bg-red-950/50", iconBg: "bg-red-100 dark:bg-red-900", text: "text-red-600 dark:text-red-400" },
  purple: { border: "border-purple-200 dark:border-purple-800", bg: "bg-purple-50 dark:bg-purple-950/50", iconBg: "bg-purple-100 dark:bg-purple-900", text: "text-purple-600 dark:text-purple-400" },
};

export function StatsCard({ title, value, color = "default", icon }: StatsCardProps) {
  const c = colorMap[color] ?? colorMap.default;

  return (
    <div className={`rounded-2xl border p-5 transition-all hover:shadow-md ${c.border} ${c.bg}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{title}</p>
        {icon && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${c.iconBg}`}>
            <svg className={`h-4 w-4 ${c.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
            </svg>
          </div>
        )}
      </div>
      <p className={`mt-2 text-3xl font-bold ${c.text}`}>
        {value}
      </p>
    </div>
  );
}
