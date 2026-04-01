interface StatsCardProps {
  title: string;
  value: number;
  color?: "default" | "yellow" | "blue" | "orange" | "green" | "red" | "purple";
}

const colorMap: Record<string, string> = {
  default: "border-zinc-200 dark:border-zinc-700",
  yellow: "border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950",
  blue: "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950",
  orange: "border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950",
  green: "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950",
  red: "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950",
  purple: "border-purple-300 bg-purple-50 dark:border-purple-800 dark:bg-purple-950",
};

export function StatsCard({ title, value, color = "default" }: StatsCardProps) {
  return (
    <div
      className={`rounded-lg border p-4 ${colorMap[color] ?? colorMap.default}`}
    >
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{title}</p>
      <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}
