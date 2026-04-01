"use client";

import { trpc } from "@/lib/trpc";
import { StatsCard } from "@/app/components/StatsCard";

export default function AdminDashboardPage() {
  const statsQuery = trpc.admin.getDashboardStats.useQuery();

  if (statsQuery.isLoading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
      </div>
    );
  }

  const stats = statsQuery.data;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Dashboard
      </h1>

      <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        Today&apos;s Overview
      </h2>
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatsCard title="Total Today" value={stats?.today.total ?? 0} />
        <StatsCard title="Pending" value={stats?.today.pending ?? 0} color="yellow" />
        <StatsCard title="Confirmed" value={stats?.today.confirmed ?? 0} color="blue" />
        <StatsCard title="In Progress" value={stats?.today.inProgress ?? 0} color="orange" />
        <StatsCard title="Completed" value={stats?.today.completed ?? 0} color="green" />
        <StatsCard title="Cancelled" value={stats?.today.cancelled ?? 0} color="red" />
      </div>

      <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        Overall
      </h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatsCard title="Total Customers" value={stats?.totalCustomers ?? 0} color="purple" />
        <StatsCard
          title="Upcoming Bookings"
          value={stats?.upcomingBookings ?? 0}
          color="blue"
        />
      </div>
    </div>
  );
}
