"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/app/components/Toast";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
  });

  const utils = trpc.useUtils();

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      toast("Account created! Welcome to SalonQ.", "success");
      router.push("/book");
    },
    onError: (err) => {
      if (err.data?.zodError) {
        const fieldErrors = err.data.zodError.fieldErrors;
        const firstMsg = Object.values(fieldErrors).flat()[0];
        toast(typeof firstMsg === "string" ? firstMsg : err.message, "error");
      } else {
        toast(err.message, "error");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(form);
  };

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const inputClass =
    "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create account</h1>
          <p className="mt-1 text-sm text-muted">Join SalonQ and book instantly</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-foreground/80">
                First Name
              </label>
              <input id="firstName" value={form.firstName} onChange={update("firstName")} required className={inputClass} />
            </div>
            <div>
              <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-foreground/80">
                Last Name
              </label>
              <input id="lastName" value={form.lastName} onChange={update("lastName")} required className={inputClass} />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground/80">
              Email
            </label>
            <input id="email" type="email" value={form.email} onChange={update("email")} required className={inputClass} placeholder="you@example.com" />
          </div>
          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-foreground/80">
              Phone
            </label>
            <input id="phone" type="tel" value={form.phone} onChange={update("phone")} required className={inputClass} placeholder="0XXXXXXXXX" />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground/80">
              Password
            </label>
            <input id="password" type="password" value={form.password} onChange={update("password")} required minLength={8} className={inputClass} placeholder="Min 8 characters" />
          </div>
          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="mt-2 rounded-xl gradient-primary py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 transition-all hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50"
          >
            {registerMutation.isPending ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
