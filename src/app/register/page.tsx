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

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Create Account
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="firstName"
                className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                First Name
              </label>
              <input
                id="firstName"
                value={form.firstName}
                onChange={update("firstName")}
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Last Name
              </label>
              <input
                id="lastName"
                value={form.lastName}
                onChange={update("lastName")}
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={update("email")}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="phone"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={update("phone")}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              placeholder="0XX-XXX-XXXX"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={update("password")}
              required
              minLength={8}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              placeholder="Min 8 characters"
            />
          </div>
          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="mt-2 rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {registerMutation.isPending ? "Creating account..." : "Register"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
