"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { trpc } from "@/lib/trpc";
import { StatsCard } from "@/app/components/StatsCard";

const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
const PieChart = dynamic(() => import("recharts").then((m) => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then((m) => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then((m) => m.Cell), { ssr: false });

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  IN_PROGRESS: "#f97316",
  COMPLETED: "#22c55e",
  CANCELLED: "#ef4444",
};

function getDateRange(preset: string) {
  const now = new Date();
  const end = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  if (preset === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return {
      startDate: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`,
      endDate: end,
    };
  }
  if (preset === "month") {
    return { startDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`, endDate: end };
  }
  // last month
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  return {
    startDate: `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}-01`,
    endDate: `${lastMonthEnd.getFullYear()}-${String(lastMonthEnd.getMonth() + 1).padStart(2, "0")}-${String(lastMonthEnd.getDate()).padStart(2, "0")}`,
  };
}

export default function AdminAnalyticsPage() {
  const [preset, setPreset] = useState("week");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const range = useMemo(() => {
    if (preset === "custom" && customStart && customEnd) {
      return { startDate: customStart, endDate: customEnd };
    }
    return getDateRange(preset);
  }, [preset, customStart, customEnd]);

  const analyticsQuery = trpc.admin.getAnalytics.useQuery(range);
  const data = analyticsQuery.data;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">วิเคราะห์</h1>
        <p className="mt-1 text-muted">ข้อมูลเชิงลึกและแนวโน้มการจอง</p>
      </div>

      {/* Date range controls */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {["week", "month", "lastMonth", "custom"].map((p) => (
          <button
            key={p}
            onClick={() => setPreset(p)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              preset === p
                ? "gradient-primary text-white shadow-md shadow-primary/25"
                : "bg-surface text-foreground/60 shadow-sm hover:bg-surface-secondary"
            }`}
          >
            {p === "week" ? "สัปดาห์นี้" : p === "month" ? "เดือนนี้" : p === "lastMonth" ? "เดือนที่แล้ว" : "กำหนดเอง"}
          </button>
        ))}
        {preset === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-xl border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
            />
            <span className="text-muted">ถึง</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-xl border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
            />
          </div>
        )}
      </div>

      {analyticsQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-border/30" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Summary cards */}
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatsCard title="การจองทั้งหมด" value={data.totalBookings} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            <StatsCard title="เสร็จสิ้น" value={data.completedBookings} color="green" icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            <StatsCard title="ยกเลิกแล้ว" value={data.cancelledBookings} color="red" icon="M6 18L18 6M6 6l12 12" />
            <StatsCard title="ไม่มาตามนัด" value={data.noShowCount} color="orange" icon="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <StatsCard title="ลูกค้าใหม่" value={data.newCustomers} color="blue" icon="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            <StatsCard title="ลูกค้าเก่า" value={data.returningCustomers} color="purple" icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </div>

          {/* Charts */}
          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            {/* Bar chart */}
            <div className="rounded-2xl border border-border bg-surface p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
                การจองรายวัน
              </h3>
              {data.bookingsByDay.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.bookingsByDay}>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-12 text-center text-sm text-muted">ไม่มีข้อมูลในช่วงนี้</p>
              )}
            </div>

            {/* Pie chart */}
            <div className="rounded-2xl border border-border bg-surface p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
                การจองตามสถานะ
              </h3>
              {data.bookingsByStatus.length > 0 ? (
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={data.bookingsByStatus}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        label={((props: any) => `${props.status}: ${props.count}`) as any}
                      >
                        {data.bookingsByStatus.map((entry) => (
                          <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#6b7280"} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-muted">ไม่มีข้อมูลในช่วงนี้</p>
              )}
            </div>
          </div>

          {/* Busiest info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="text-sm text-muted">วันที่คนเยอะที่สุด</p>
              <p className="mt-1 text-xl font-bold text-primary">
                {data.busiestDay
                  ? new Date(data.busiestDay + "T00:00:00").toLocaleDateString("th-TH", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="text-sm text-muted">ช่วงเวลาที่คนเยอะที่สุด</p>
              <p className="mt-1 text-xl font-bold text-primary">
                {data.busiestTimeSlot ?? "—"}
              </p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
