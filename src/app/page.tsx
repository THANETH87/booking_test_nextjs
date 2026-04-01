import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero px-4 py-20 sm:py-28">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        </div>
        <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
          <div className="animate-slide-up inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/90 glass">
            <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            Open today 09:00 - 20:00
          </div>
          <h1 className="animate-slide-up stagger-1 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            Your perfect look,
            <br />
            <span className="text-accent-light">just one tap away</span>
          </h1>
          <p className="animate-slide-up stagger-2 max-w-lg text-lg text-white/70">
            Book your salon appointment in seconds. No waiting, no phone calls — just pick your time and show up.
          </p>
          <div className="animate-slide-up stagger-3 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/book"
              className="rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-primary-dark shadow-lg shadow-black/10 transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              Book Now
            </Link>
            <Link
              href="/register"
              className="rounded-xl border-2 border-white/30 px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-5xl px-4 py-16 sm:py-20">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            How it works
          </h2>
          <p className="mt-2 text-muted">Three simple steps to your appointment</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Pick a date",
              desc: "Browse available dates for the next 14 days",
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              ),
            },
            {
              step: "2",
              title: "Choose your slot",
              desc: "Select from available 30-minute time slots",
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              ),
            },
            {
              step: "3",
              title: "You're booked!",
              desc: "Get instant confirmation and manage anytime",
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              ),
            },
          ].map((item) => (
            <div
              key={item.step}
              className="animate-slide-up group flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-8 text-center transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {item.icon}
                </svg>
              </div>
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Info bar */}
      <section className="border-t border-border bg-surface-secondary px-4 py-10">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 sm:gap-16">
          {[
            { label: "Opening", value: "09:00 - 20:00" },
            { label: "Duration", value: "30 min" },
            { label: "Max daily", value: "20 slots" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-2xl font-bold text-primary">{item.value}</p>
              <p className="text-sm text-muted">{item.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
