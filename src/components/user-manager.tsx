"use client";

import { useState } from "react";

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

// Stateful on purpose: the same component serves the server-rendered
// /admin/users page and the client-fetched command center, so actions
// update the local list instead of relying on a page refresh.
export function UserManager({
  users,
  currentUserId,
  currentUserRole,
}: {
  users: AdminUser[];
  currentUserId: string;
  currentUserRole: string;
}) {
  const [list, setList] = useState(users);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ id: string; text: string; ok: boolean } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("CLIENT");
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState<{ text: string; ok: boolean } | null>(null);

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
      setList((current) => current.map((u) => {
        if (u.id !== user.id) return u;
        if (body.disabled !== undefined) return { ...u, disabled: Boolean(body.disabled) };
        if (body.role) return { ...u, role: String(body.role) };
        return u;
      }));
      setMessage({ id: user.id, text: successText, ok: true });
    } catch {
      setMessage({ id: user.id, text: "That change failed. Check your connection and try again.", ok: false });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(user: AdminUser) {
    setBusyId(user.id);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ id: user.id, text: data.error || "Delete failed.", ok: false });
        return;
      }
      setList((current) => current.filter((u) => u.id !== user.id));
      setConfirmDeleteId(null);
    } catch {
      setMessage({ id: user.id, text: "Delete failed. Check your connection and try again.", ok: false });
    } finally {
      setBusyId(null);
    }
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    setCreateMessage(null);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), email: newEmail.trim(), password: newPassword, role: newRole }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not create the account.");
      setList((current) => [data.user as AdminUser, ...current]);
      setCreateMessage({ text: `Account created for ${data.user.email}. They can sign in right away with the password you set.`, ok: true });
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("CLIENT");
    } catch (e) {
      setCreateMessage({ text: e instanceof Error ? e.message : "Could not create the account.", ok: false });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="card p-6">
        <h3 className="font-semibold">Add a user</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm">Name
            <input value={newName} onChange={(e) => setNewName(e.target.value)} required className="input mt-1 w-full" />
          </label>
          <label className="text-sm">Email
            <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required type="email" className="input mt-1 w-full" />
          </label>
          <label className="text-sm">Password (min 10 characters)
            <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={10} type="password" className="input mt-1 w-full" />
          </label>
          <label className="text-sm">Role
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="input mt-1 w-full">
              <option value="CLIENT">Client</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
        </div>
        {createMessage && <p className={`mt-3 text-sm ${createMessage.ok ? "text-emerald-300" : "text-rose-300"}`}>{createMessage.text}</p>}
        <button type="submit" disabled={creating} className="btn-primary mt-4 disabled:opacity-50">
          {creating ? "Creating…" : "Create account"}
        </button>
        <p className="mt-3 text-xs text-slate-500">The account is created already verified, so the person can sign in immediately. Owner accounts are not created here — those use the provisioning script.</p>
      </form>

      {!list.length ? <p className="text-sm text-slate-500">No accounts yet.</p> : (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-[1.4fr_.8fr_1.6fr] gap-3 border-b border-white/10 p-4 text-xs uppercase tracking-wider text-slate-500 max-lg:hidden">
            <span>User</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {list.map((u) => {
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
                    {!isSelf && (confirmDeleteId === u.id ? (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void remove(u)}
                          className="btn-secondary px-3 py-1.5 text-xs font-semibold text-rose-300"
                        >
                          {busy ? "Deleting…" : "Confirm delete"}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setConfirmDeleteId(null)}
                          className="btn-secondary px-3 py-1.5 text-xs"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirmDeleteId(u.id)}
                        className="btn-secondary px-3 py-1.5 text-xs text-rose-300"
                      >
                        Delete
                      </button>
                    ))}
                  </div>
                </div>
                {message?.id === u.id && (
                  <p className={`mt-2 text-xs ${message.ok ? "text-emerald-300" : "text-red-300"}`}>{message.text}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
      <p className="text-xs text-slate-500">Deleting is only for accounts with no history — an account with orders, invoices, projects, tickets, or messages can't be deleted, so its records stay intact. Disable those instead.</p>
    </div>
  );
}
