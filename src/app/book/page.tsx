"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/app/components/Toast";
import { DatePicker } from "@/app/components/DatePicker";
import { SlotGrid } from "@/app/components/SlotGrid";

export default function BookPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState<"member" | "guest">("member");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  // Guest form state
  const [guestForm, setGuestForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [guestSuccess, setGuestSuccess] = useState<string | null>(null);

  const holidaysQuery = trpc.slot.getHolidayDates.useQuery();
  const holidays = holidaysQuery.data?.map((h) => h.date) ?? [];

  const slotsQuery = trpc.slot.getAvailable.useQuery(
    { date: selectedDate! },
    { enabled: !!selectedDate }
  );

  const bookMutation = trpc.booking.create.useMutation({
    onSuccess: () => {
      toast("จองสำเร็จ!", "success");
      router.push("/my-bookings");
    },
    onError: (err) => toast(err.message, "error"),
  });

  const guestBookMutation = trpc.guest.create.useMutation({
    onSuccess: (data) => {
      toast("จองสำเร็จ! ตรวจสอบอีเมลของคุณ", "success");
      setGuestSuccess(data.cancelToken);
    },
    onError: (err) => toast(err.message, "error"),
  });

  const waitlistMutation = trpc.waitlist.join.useMutation({
    onSuccess: () => toast("เพิ่มในรายการรอแล้ว! เราจะแจ้งเตือนเมื่อมีคิวว่าง", "success"),
    onError: (err) => toast(err.message, "error"),
  });

  const selectedSlot = slotsQuery.data?.find((s) => s.id === selectedSlotId);
  const availableCount = slotsQuery.data?.filter((s) => !s.isBlocked && !s.isBooked && !s.isPast).length ?? 0;

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedSlotId(null);
    setShowConfirm(false);
  };

  const handleSlotSelect = (slotId: number) => {
    setSelectedSlotId(slotId);
    setShowConfirm(true);
  };

  const handleBook = () => {
    if (!selectedSlotId) return;
    if (tab === "member") {
      bookMutation.mutate({ slotId: selectedSlotId, note: note.trim() || undefined });
    } else {
      guestBookMutation.mutate({
        ...guestForm,
        slotId: selectedSlotId,
        note: note.trim() || undefined,
      });
    }
  };

  const inputClass = "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

  if (guestSuccess) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900">
          <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">จองสำเร็จ!</h1>
        <p className="mt-2 text-muted">อีเมลยืนยันถูกส่งแล้ว คุณสามารถยกเลิกได้ตลอดเวลาผ่านลิงก์ในอีเมล</p>
        <button
          onClick={() => { setGuestSuccess(null); setSelectedSlotId(null); setShowConfirm(false); setGuestForm({ firstName: "", lastName: "", email: "", phone: "" }); setNote(""); }}
          className="mt-6 rounded-xl gradient-primary px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-primary/25"
        >
          จองอีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">จองนัดหมาย</h1>
        <p className="mt-1 text-muted">เลือกวันและเวลาที่คุณต้องการ</p>
      </div>

      {/* Tabs: Member / Guest */}
      <div className="mb-8 flex gap-1 rounded-xl bg-surface-secondary p-1">
        {(["member", "guest"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSelectedSlotId(null); setShowConfirm(false); }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
              tab === t ? "bg-surface text-foreground shadow-sm" : "text-muted"
            }`}
          >
            {t === "member" ? "จองแบบสมาชิก" : "จองแบบบุคคลทั่วไป"}
          </button>
        ))}
      </div>

      {/* Guest info form */}
      {tab === "guest" && (
        <div className="animate-slide-up mb-8 rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">ข้อมูลของคุณ</h2>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="ชื่อ *" value={guestForm.firstName} onChange={(e) => setGuestForm((f) => ({ ...f, firstName: e.target.value }))} className={inputClass} />
            <input placeholder="นามสกุล *" value={guestForm.lastName} onChange={(e) => setGuestForm((f) => ({ ...f, lastName: e.target.value }))} className={inputClass} />
            <input placeholder="อีเมล *" type="email" value={guestForm.email} onChange={(e) => setGuestForm((f) => ({ ...f, email: e.target.value }))} className={inputClass} />
            <input placeholder="เบอร์โทร * (0XXXXXXXXX)" value={guestForm.phone} onChange={(e) => setGuestForm((f) => ({ ...f, phone: e.target.value }))} className={inputClass} />
          </div>
        </div>
      )}

      {/* Step 1: Date */}
      <div className="mb-10">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-sm font-bold text-white">1</div>
          <h2 className="text-lg font-semibold text-foreground">เลือกวันที่</h2>
        </div>
        <DatePicker selectedDate={selectedDate} onSelect={handleDateSelect} holidays={holidays} />
      </div>

      {/* Step 2: Time */}
      {selectedDate && (
        <div className="animate-slide-up mb-10">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-sm font-bold text-white">2</div>
              <h2 className="text-lg font-semibold text-foreground">เลือกเวลา</h2>
            </div>
            {!slotsQuery.isLoading && (
              <span className="text-sm text-muted">{availableCount} ว่าง</span>
            )}
          </div>

          <div className="mb-3 flex gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-md border border-transparent bg-surface shadow-sm" /> ว่าง
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-md bg-surface-secondary" /> ถูกจอง
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-md border border-red-200 bg-red-50" /> ปิดให้บริการ
            </span>
          </div>

          <SlotGrid
            slots={slotsQuery.data ?? []}
            selectedSlotId={selectedSlotId}
            onSelect={handleSlotSelect}
            onJoinWaitlist={tab === "member" ? (slotId) => waitlistMutation.mutate({ slotId }) : undefined}
            isLoading={slotsQuery.isLoading}
          />
        </div>
      )}

      {/* Step 3: Confirm */}
      {showConfirm && selectedSlot && (
        <div className="animate-slide-up">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-sm font-bold text-white">3</div>
            <h2 className="text-lg font-semibold text-foreground">ยืนยันการจอง</h2>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-surface-secondary p-6">
            <div className="mb-5 flex items-center gap-4">
              <div className="rounded-2xl gradient-primary px-5 py-3 text-white shadow-lg shadow-primary/25">
                <span className="text-2xl font-bold">{selectedSlot.startTime}</span>
                <span className="mx-1.5 text-white/60">-</span>
                <span className="text-2xl font-bold">{selectedSlot.endTime}</span>
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("th-TH", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-sm text-muted">นัดหมาย 30 นาที</p>
              </div>
            </div>

            <div className="mb-5">
              <label htmlFor="note" className="mb-1.5 block text-sm font-medium text-foreground/80">
                หมายเหตุ (ไม่บังคับ)
              </label>
              <input
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                className={inputClass}
                placeholder="คำขอพิเศษ..."
              />
            </div>

            <button
              onClick={handleBook}
              disabled={bookMutation.isPending || guestBookMutation.isPending}
              className="w-full rounded-xl gradient-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50 sm:w-auto sm:px-8"
            >
              {(bookMutation.isPending || guestBookMutation.isPending) ? "กำลังจอง..." : "ยืนยันการจอง"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
