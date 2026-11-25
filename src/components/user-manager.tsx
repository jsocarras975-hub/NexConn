"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  disabled: boolean;
  verified: boolean;
  joined: string;
  orders: number;
  projects: number;
  tickets: number;
};

export function UserManager({
  users,
  currentUserId,
  currentUserRole,
}: {
  users: AdminUser[];
  currentUserId: string;
  currentUserRole: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ id: string; text: string; ok: boolean } | null>(null);

  async function act(user: AdminUser, body: Record<string, unknown>, successText: string) {
    setBusyId(user.id);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ id: user.id, text: data.error || "That change failed.", ok: false });
        return;
      }
      setMessage({ id: user.id, text: successText, ok: true });
      router.refresh();
    } catch {
      setMessage({ id: user.id, text: "That change failed. Check your connection and try again.", ok: false });
    } finally {
      setBusyId(null);
    }
  }

  if (!users.length) return <p className="text-sm text-slate-500">No accounts yet.</p>;

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-[1.4fr_.8fr_1.6fr] gap-3 border-b border-white/10 p-4 text-xs uppercase tracking-wider text-slate-500 max-lg:hidden">
        <span>User</span>
        <span>Status</span>
        <span>Actions</span>
      </div>
      {users.map((u) => {
        const isSelf = u.id === currentUserId;
        const busy = busyId === u.id;
        return (
          <div key={u.id} className="border-b border-white/5 p-4 last:border-0">
            <div className="grid grid-cols-[1.4fr_.8fr_1.6fr] gap-3 max-lg:grid-cols-1">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {u.name} {isSelf && <span className="text-xs text-slate-500">(you)</span>}
                </p>
                <p className="truncate text-xs text-slate-500">{u.email}</p>
                <p className="text-xs text-slate-500">
                  Joined {u.joined} · {u.orders} orders · {u.projects} projects · {u.tickets} tickets
                </p>
              </div>
              <div className="flex flex-wrap items-start gap-2 text-xs">
                <span className="rounded-full border border-white/10 px-2 py-0.5">{u.role}</span>
                {u.disabled && <span className="rounded-full border border-red-400/40 px-2 py-0.5 text-red-300">Disabled</span>}
                {!u.verified && <span className="rounded-full border border-amber-400/40 px-2 py-0.5 text-amber-300">Unverified</span>}
              </div>
              <div className="flex flex-wrap items-start gap-2">
                {!isSelf && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => act(u, { disabled: !u.disabled }, u.disabled ? "Account enabled." : "Account disabled and signed out everywhere.")}
                    className="btn-secondary px-3 py-1.5 text-xs"
                  >
                    {u.disabled ? "Enable" : "Disable"}
                  </button>
                )}
                {!u.verified && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => act(u, { action: "resend-verification" }, "Verification email sent.")}
                    className="btn-secondary px-3 py-1.5 text-xs"
                  >
                    Resend verification
                  </button>
                )}
                {currentUserRole === "OWNER" && !isSelf && (
                  <select
                    aria-label={`Role for ${u.name}`}
                    disabled={busy}
                    value={u.role}
                    onChange={(event) => act(u, { role: event.target.value }, `Role changed to ${event.target.value}.`)}
                    className="rounded-md border border-white/10 bg-transparent px-2 py-1.5 text-xs"
                  >
                    <option value="CLIENT">Client</option>
                    <option value="ADMIN">Admin</option>
                    <option value="OWNER">Owner</option>
                  </select>
                )}
              </div>
            </div>
            {message?.id === u.id && (
              <p className={`mt-2 text-xs ${message.ok ? "text-emerald-300" : "text-red-300"}`}>{message.text}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
