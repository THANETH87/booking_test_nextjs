"use client";

import { trpc } from "@/lib/trpc";
import { StatsCard } from "@/app/components/StatsCard";

export default function AdminDashboardPage() {
  const statsQuery = trpc.admin.getDashboardStats.useQuery();

  if (statsQuery.isLoading) {
    return (
      <div>
        <h1 className="mb-8 text-3xl font-bold text-foreground">Dashboard</h1>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-border/30" />
          ))}
        </div>
      </div>
    );
  }

  const stats = statsQuery.data;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted">Overview of today&apos;s salon activity</p>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Today
        </h2>
      </div>
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatsCard title="Total Bookings" value={stats?.today.total ?? 0} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        <StatsCard title="Pending" value={stats?.today.pending ?? 0} color="yellow" icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        <StatsCard title="Confirmed" value={stats?.today.confirmed ?? 0} color="blue" icon="M5 13l4 4L19 7" />
        <StatsCard title="In Progress" value={stats?.today.inProgress ?? 0} color="orange" icon="M13 10V3L4 14h7v7l9-11h-7z" />
        <StatsCard title="Completed" value={stats?.today.completed ?? 0} color="green" icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        <StatsCard title="Cancelled" value={stats?.today.cancelled ?? 0} color="red" icon="M6 18L18 6M6 6l12 12" />
      </div>

      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
        Overall
      </h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatsCard title="Total Customers" value={stats?.totalCustomers ?? 0} color="purple" icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        <StatsCard title="Upcoming" value={stats?.upcomingBookings ?? 0} color="blue" icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </div>
    </div>
  );
}
