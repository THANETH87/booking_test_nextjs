import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="flex max-w-lg flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
            SalonQ
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Professional hair salon booking. Pick your time, skip the wait.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 rounded-xl border border-zinc-200 bg-zinc-50 px-8 py-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Open daily 09:00 - 20:00</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>30-minute appointments</span>
          </div>
        </div>

        <Link
          href="/book"
          className="rounded-lg bg-zinc-900 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Book Now
        </Link>
      </div>
    </div>
  );
}
