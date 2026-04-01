"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/app/components/Toast";

const ROLES = ["ALL", "USER", "ADMIN"] as const;

export default function AdminUsersPage() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "USER" as "USER" | "ADMIN",
  });

  const usersQuery = trpc.admin.getUsers.useQuery({
    search: search || undefined,
    role: role === "ALL" ? undefined : (role as "USER"),
    page,
    limit: 20,
  });

  const updateMutation = trpc.admin.updateUser.useMutation({
    onSuccess: () => {
      toast("User updated", "success");
      utils.admin.getUsers.invalidate();
      setEditingId(null);
    },
    onError: (err) => toast(err.message, "error"),
  });

  const deleteMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast("User deleted", "success");
      utils.admin.getUsers.invalidate();
    },
    onError: (err) => toast(err.message, "error"),
  });

  const startEdit = (user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: "USER" | "ADMIN";
  }) => {
    setEditingId(user.id);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateMutation.mutate({ userId: editingId, ...editForm });
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Users
      </h1>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search name, email, phone..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r === "ALL" ? "All Roles" : r}
            </option>
          ))}
        </select>
      </div>

      {usersQuery.isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          ))}
        </div>
      ) : usersQuery.data?.users.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No users found.
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="px-3 py-2 font-medium text-zinc-500 dark:text-zinc-400">ID</th>
                  <th className="px-3 py-2 font-medium text-zinc-500 dark:text-zinc-400">Name</th>
                  <th className="px-3 py-2 font-medium text-zinc-500 dark:text-zinc-400">Email</th>
                  <th className="px-3 py-2 font-medium text-zinc-500 dark:text-zinc-400">Phone</th>
                  <th className="px-3 py-2 font-medium text-zinc-500 dark:text-zinc-400">Role</th>
                  <th className="px-3 py-2 font-medium text-zinc-500 dark:text-zinc-400">Bookings</th>
                  <th className="px-3 py-2 font-medium text-zinc-500 dark:text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersQuery.data?.users.map((u) => (
                  <tr key={u.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    {editingId === u.id ? (
                      <>
                        <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100">#{u.id}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            <input
                              value={editForm.firstName}
                              onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                              className="w-20 rounded border border-zinc-300 px-1 py-0.5 text-xs dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                            />
                            <input
                              value={editForm.lastName}
                              onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                              className="w-20 rounded border border-zinc-300 px-1 py-0.5 text-xs dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={editForm.email}
                            onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                            className="w-40 rounded border border-zinc-300 px-1 py-0.5 text-xs dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={editForm.phone}
                            onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                            className="w-28 rounded border border-zinc-300 px-1 py-0.5 text-xs dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={editForm.role}
                            onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value as "USER" | "ADMIN" }))}
                            className="rounded border border-zinc-300 px-1 py-0.5 text-xs dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">{u._count.bookings}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            <button
                              onClick={saveEdit}
                              disabled={updateMutation.isPending}
                              className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50 dark:bg-green-900 dark:text-green-300"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100">#{u.id}</td>
                        <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100">
                          {u.firstName} {u.lastName}
                        </td>
                        <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">{u.email}</td>
                        <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">{u.phone}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              u.role === "ADMIN"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                                : "bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">{u._count.bookings}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            <button
                              onClick={() => startEdit(u)}
                              className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete user ${u.firstName} ${u.lastName}?`)) {
                                  deleteMutation.mutate({ userId: u.id });
                                }
                              }}
                              disabled={deleteMutation.isPending}
                              className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50 dark:bg-red-900 dark:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {usersQuery.data?.users.map((u) => (
              <div
                key={u.id}
                className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {u.firstName} {u.lastName}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.role === "ADMIN"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                        : "bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {u.role}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{u.email}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{u.phone}</p>
                <p className="text-xs text-zinc-400">{u._count.bookings} bookings</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => startEdit(u)}
                    className="rounded bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete user ${u.firstName} ${u.lastName}?`)) {
                        deleteMutation.mutate({ userId: u.id });
                      }
                    }}
                    className="rounded bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {usersQuery.data && usersQuery.data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-600"
              >
                Previous
              </button>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Page {page} of {usersQuery.data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= usersQuery.data.totalPages}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-600"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
