"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useToast } from "./Toast";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
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

  const isActive = (href: string) =>
    pathname === href
      ? "text-primary font-semibold"
      : "text-foreground/60 hover:text-foreground";

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-surface/80 glass">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Salon<span className="text-primary">Q</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {isLoading ? (
            <div className="flex gap-2">
              <div className="h-8 w-16 animate-pulse rounded-lg bg-border" />
              <div className="h-8 w-16 animate-pulse rounded-lg bg-border" />
            </div>
          ) : user ? (
            <>
              <Link
                href="/book"
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${isActive("/book")}`}
              >
                Book
              </Link>
              <Link
                href="/my-bookings"
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${isActive("/my-bookings")}`}
              >
                My Bookings
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${pathname.startsWith("/admin") ? "text-primary font-semibold" : "text-foreground/60 hover:text-foreground"}`}
                >
                  Admin
                </Link>
              )}

              <div className="mx-2 h-5 w-px bg-border" />

              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {user.firstName[0]}
                </div>
                <span className="text-sm text-foreground/70">
                  {user.firstName}
                </span>
              </div>
              <button
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="ml-1 rounded-lg px-3 py-1.5 text-sm text-foreground/60 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${isActive("/login")}`}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="ml-1 rounded-lg gradient-primary px-4 py-1.5 text-sm font-medium text-white shadow-sm shadow-primary/25 transition-all hover:shadow-md hover:shadow-primary/30"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-surface-secondary md:hidden"
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
        <div className="animate-fade-in border-t border-border px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {user ? (
              <>
                <div className="mb-3 flex items-center gap-2 px-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {user.firstName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-muted">{user.email}</p>
                  </div>
                </div>
                <Link href="/book" onClick={() => setMobileOpen(false)} className={`rounded-lg px-3 py-2 text-sm transition-colors ${isActive("/book")}`}>
                  Book Appointment
                </Link>
                <Link href="/my-bookings" onClick={() => setMobileOpen(false)} className={`rounded-lg px-3 py-2 text-sm transition-colors ${isActive("/my-bookings")}`}>
                  My Bookings
                </Link>
                {user.role === "ADMIN" && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)} className={`rounded-lg px-3 py-2 text-sm transition-colors ${isActive("/admin")}`}>
                    Admin Panel
                  </Link>
                )}
                <div className="my-2 h-px bg-border" />
                <button
                  onClick={() => { logoutMutation.mutate(); setMobileOpen(false); }}
                  className="rounded-lg px-3 py-2 text-left text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm text-foreground/70">
                  Login
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="rounded-lg gradient-primary px-3 py-2 text-center text-sm font-medium text-white">
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
