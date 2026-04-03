"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/app/components/Toast";
import { DatePicker } from "@/app/components/DatePicker";

export default function AdminSlotsPage() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState("");

  const slotsQuery = trpc.slot.getAvailable.useQuery(
    { date: selectedDate! },
    { enabled: !!selectedDate }
  );

  const blockMutation = trpc.slot.blockSlot.useMutation({
    onSuccess: () => {
      toast("บล็อกช่วงเวลาแล้ว", "success");
      utils.slot.getAvailable.invalidate();
      setBlockReason("");
    },
    onError: (err) => toast(err.message, "error"),
  });

  const unblockMutation = trpc.slot.unblockSlot.useMutation({
    onSuccess: () => {
      toast("ปลดบล็อกช่วงเวลาแล้ว", "success");
      utils.slot.getAvailable.invalidate();
    },
    onError: (err) => toast(err.message, "error"),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        จัดการช่วงเวลา
      </h1>

      <div className="mb-6">
        <DatePicker
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
        />
      </div>

      {selectedDate && slotsQuery.isLoading && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 22 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
      )}

      {selectedDate && slotsQuery.data && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {slotsQuery.data.map((slot) => (
            <div
              key={slot.id}
              className={`rounded-lg border p-3 ${
                slot.isBlocked
                  ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
                  : slot.isBooked
                    ? "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800"
                    : "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {slot.startTime} - {slot.endTime}
                </span>
                <span
                  className={`text-xs font-medium ${
                    slot.isBlocked
                      ? "text-red-600 dark:text-red-400"
                      : slot.isBooked
                        ? "text-zinc-500 dark:text-zinc-400"
                        : "text-green-600 dark:text-green-400"
                  }`}
                >
                  {slot.isBlocked ? "ปิดให้บริการ" : slot.isBooked ? "ถูกจอง" : "ว่าง"}
                </span>
              </div>
              {slot.isBlocked && slot.blockedReason && (
                <p className="mb-2 text-xs text-red-500 dark:text-red-400">
                  {slot.blockedReason}
                </p>
              )}
              {slot.isBlocked ? (
                <button
                  onClick={() => unblockMutation.mutate({ slotId: slot.id })}
                  disabled={unblockMutation.isPending}
                  className="w-full rounded bg-white px-2 py-1 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-200"
                >
                  ปลดบล็อก
                </button>
              ) : !slot.isBooked ? (
                <div className="flex gap-1">
                  <input
                    placeholder="เหตุผล"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="flex-1 rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  <button
                    onClick={() =>
                      blockMutation.mutate({
                        slotId: slot.id,
                        reason: blockReason.trim() || undefined,
                      })
                    }
                    disabled={blockMutation.isPending}
                    className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50 dark:bg-red-900 dark:text-red-300"
                  >
                    บล็อก
                  </button>
                </div>
              ) : (
                <p className="text-xs text-zinc-400">มีการจองอยู่</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
