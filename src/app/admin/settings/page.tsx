"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/app/components/Toast";

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");

  const holidaysQuery = trpc.admin.getHolidays.useQuery({ year });

  const addMutation = trpc.admin.addHoliday.useMutation({
    onSuccess: () => {
      toast("เพิ่มวันหยุดแล้ว การจองที่มีอยู่ในวันนั้นถูกยกเลิกแล้ว", "success");
      utils.admin.getHolidays.invalidate();
      setNewDate("");
      setNewReason("");
    },
    onError: (err) => toast(err.message, "error"),
  });

  const removeMutation = trpc.admin.removeHoliday.useMutation({
    onSuccess: () => {
      toast("ลบวันหยุดแล้ว", "success");
      utils.admin.getHolidays.invalidate();
    },
    onError: (err) => toast(err.message, "error"),
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">ตั้งค่า</h1>
        <p className="mt-1 text-muted">จัดการวันหยุดร้าน</p>
      </div>

      {/* Add Holiday */}
      <div className="mb-8 rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">เพิ่มวันหยุด</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">วันที่</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">เหตุผล (ไม่บังคับ)</label>
            <input
              type="text"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="เช่น วันปีใหม่"
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={() => {
              if (!newDate) return toast("กรุณาเลือกวันที่", "error");
              addMutation.mutate({ date: newDate, reason: newReason || undefined });
            }}
            disabled={addMutation.isPending}
            className="rounded-xl gradient-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 disabled:opacity-50"
          >
            {addMutation.isPending ? "กำลังเพิ่ม..." : "เพิ่มวันหยุด"}
          </button>
        </div>
      </div>

      {/* Holiday List */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">วันหยุด</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setYear((y) => y - 1)}
              className="rounded-lg border border-border px-2 py-1 text-sm hover:bg-surface-secondary"
            >
              &larr;
            </button>
            <span className="text-sm font-medium text-foreground">{year}</span>
            <button
              onClick={() => setYear((y) => y + 1)}
              className="rounded-lg border border-border px-2 py-1 text-sm hover:bg-surface-secondary"
            >
              &rarr;
            </button>
          </div>
        </div>

        {holidaysQuery.isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-border/30" />
            ))}
          </div>
        ) : holidaysQuery.data?.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            ยังไม่มีวันหยุดสำหรับปี {year}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {holidaysQuery.data?.map((h) => {
              const dateStr = new Date(h.date).toISOString().split("T")[0];
              return (
                <div
                  key={h.id}
                  className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/50"
                >
                  <div>
                    <span className="font-medium text-foreground">
                      {new Date(h.date).toLocaleDateString("th-TH", {
                        weekday: "short",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    {h.reason && (
                      <span className="ml-2 text-sm text-muted">— {h.reason}</span>
                    )}
                  </div>
                  <button
                    onClick={() => removeMutation.mutate({ date: dateStr })}
                    disabled={removeMutation.isPending}
                    className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-red-600 shadow-sm hover:bg-red-50 disabled:opacity-50 dark:bg-red-900 dark:text-red-300"
                  >
                    ลบ
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
