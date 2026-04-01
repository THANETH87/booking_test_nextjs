"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useToast } from "./Toast";
import { DatePicker } from "./DatePicker";
import { SlotGrid } from "./SlotGrid";

interface ManualBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ManualBookingModal({ isOpen, onClose }: ManualBookingModalProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const [tab, setTab] = useState<"user" | "guest">("user");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [guestForm, setGuestForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const usersQuery = trpc.admin.getUsers.useQuery(
    { search: searchQuery, page: 1, limit: 10 },
    { enabled: tab === "user" && searchQuery.length > 0 }
  );

  const slotsQuery = trpc.slot.getAvailable.useQuery(
    { date: selectedDate! },
    { enabled: !!selectedDate }
  );

  const createMutation = trpc.admin.createManualBooking.useMutation({
    onSuccess: () => {
      toast("Booking created!", "success");
      utils.booking.getAll.invalidate();
      onClose();
    },
    onError: (err) => toast(err.message, "error"),
  });

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!selectedSlotId) return toast("Please select a slot", "error");

    if (tab === "user") {
      if (!selectedUserId) return toast("Please select a user", "error");
      createMutation.mutate({ userId: selectedUserId, slotId: selectedSlotId, note: note || undefined });
    } else {
      if (!guestForm.firstName || !guestForm.lastName || !guestForm.phone) {
        return toast("Please fill in guest details", "error");
      }
      createMutation.mutate({
        guestFirstName: guestForm.firstName,
        guestLastName: guestForm.lastName,
        guestEmail: guestForm.email || undefined,
        guestPhone: guestForm.phone,
        slotId: selectedSlotId,
        note: note || undefined,
      });
    }
  };

  const inputClass = "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 glass" onClick={onClose} />
      <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Manual Booking</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-secondary">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl bg-surface-secondary p-1">
          {(["user", "guest"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSelectedUserId(null); }}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                tab === t ? "bg-surface text-foreground shadow-sm" : "text-muted"
              }`}
            >
              {t === "user" ? "Existing User" : "Guest"}
            </button>
          ))}
        </div>

        {/* User / Guest selection */}
        {tab === "user" ? (
          <div className="mb-6">
            <input
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={inputClass}
            />
            {usersQuery.data && usersQuery.data.users.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-border">
                {usersQuery.data.users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => { setSelectedUserId(u.id); setSearchQuery(`${u.firstName} ${u.lastName}`); }}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface-secondary ${
                      selectedUserId === u.id ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {u.firstName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-muted">{u.email} &middot; {u.phone}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6 grid grid-cols-2 gap-3">
            <input placeholder="First Name" value={guestForm.firstName} onChange={(e) => setGuestForm((f) => ({ ...f, firstName: e.target.value }))} className={inputClass} />
            <input placeholder="Last Name" value={guestForm.lastName} onChange={(e) => setGuestForm((f) => ({ ...f, lastName: e.target.value }))} className={inputClass} />
            <input placeholder="Email (optional)" type="email" value={guestForm.email} onChange={(e) => setGuestForm((f) => ({ ...f, email: e.target.value }))} className={inputClass} />
            <input placeholder="Phone (0XXXXXXXXX)" value={guestForm.phone} onChange={(e) => setGuestForm((f) => ({ ...f, phone: e.target.value }))} className={inputClass} />
          </div>
        )}

        {/* Slot selection */}
        <div className="mb-4">
          <p className="mb-3 text-sm font-medium text-muted">Select date & time</p>
          <DatePicker selectedDate={selectedDate} onSelect={(d) => { setSelectedDate(d); setSelectedSlotId(null); }} />
        </div>

        {selectedDate && (
          <div className="mb-4">
            <SlotGrid
              slots={slotsQuery.data ?? []}
              selectedSlotId={selectedSlotId}
              onSelect={setSelectedSlotId}
              isLoading={slotsQuery.isLoading}
            />
          </div>
        )}

        <div className="mb-4">
          <input
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={createMutation.isPending}
          className="w-full rounded-xl gradient-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-50"
        >
          {createMutation.isPending ? "Creating..." : "Create Booking"}
        </button>
      </div>
    </div>
  );
}
