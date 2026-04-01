"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useToast } from "./Toast";

export function Navbar() {
  const router = useRouter();
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });

  const utils = trpc.useUtils();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      toast("Logged out successfully", "success");
      router.push("/login");
    },
  });

  return (
    <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          SalonQ
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-4 md:flex">
          {isLoading ? (
            <div className="h-5 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          ) : user ? (
            <>
              <Link
                href="/book"
                className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                Book
              </Link>
              <Link
                href="/my-bookings"
                className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                My Bookings
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  Admin
                </Link>
              )}
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {user.firstName}
              </span>
              <button
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-zinc-600 dark:text-zinc-400"
          aria-label="Toggle menu"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-zinc-200 px-4 py-3 md:hidden dark:border-zinc-800">
          <div className="flex flex-col gap-3">
            {user ? (
              <>
                <Link href="/book" onClick={() => setMobileOpen(false)} className="text-sm text-zinc-600 dark:text-zinc-400">
                  Book
                </Link>
                <Link href="/my-bookings" onClick={() => setMobileOpen(false)} className="text-sm text-zinc-600 dark:text-zinc-400">
                  My Bookings
                </Link>
                {user.role === "ADMIN" && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)} className="text-sm text-zinc-600 dark:text-zinc-400">
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    logoutMutation.mutate();
                    setMobileOpen(false);
                  }}
                  className="text-left text-sm text-zinc-600 dark:text-zinc-400"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="text-sm text-zinc-600 dark:text-zinc-400">
                  Login
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="text-sm text-zinc-600 dark:text-zinc-400">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
