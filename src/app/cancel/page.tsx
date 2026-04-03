"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/app/components/Toast";

function CancelContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { toast } = useToast();
  const [cancelled, setCancelled] = useState(false);

  const cancelMutation = trpc.guest.cancelByToken.useMutation({
    onSuccess: () => {
      setCancelled(true);
      toast("ยกเลิกการจองสำเร็จ", "success");
    },
    onError: (err) => {
      toast(err.message, "error");
    },
  });

  if (!token) {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">ลิงก์ไม่ถูกต้อง</h1>
          <p className="mt-2 text-muted">ไม่พบโทเค็นสำหรับยกเลิก</p>
          <Link href="/" className="mt-4 inline-block text-primary hover:underline">
            กลับหน้าแรก
          </Link>
        </div>
      </div>
    );
  }

  if (cancelled) {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900">
            <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">ยกเลิกการจองแล้ว</h1>
          <p className="mt-2 text-muted">การจองของคุณถูกยกเลิกเรียบร้อยแล้ว</p>
          <Link
            href="/book"
            className="mt-6 inline-block rounded-xl gradient-primary px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-primary/25"
          >
            จองใหม่
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900">
          <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-foreground">ยกเลิกการจอง?</h1>
        <p className="mt-2 text-sm text-muted">
          คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => cancelMutation.mutate({ cancelToken: token })}
            disabled={cancelMutation.isPending}
            className="rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-red-700 disabled:opacity-50"
          >
            {cancelMutation.isPending ? "กำลังยกเลิก..." : "ใช่ ยกเลิกการจอง"}
          </button>
          <Link
            href="/"
            className="rounded-xl border border-border py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-surface-secondary"
          >
            ไม่เป็นไร
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CancelPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-pulse rounded-full bg-border" />
        </div>
      }
    >
      <CancelContent />
    </Suspense>
  );
}
