"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/slots", label: "Slots" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 md:flex-row">
      {/* Sidebar */}
      <aside className="flex flex-row gap-1 md:w-48 md:flex-col md:gap-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </aside>

      {/* Main content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
