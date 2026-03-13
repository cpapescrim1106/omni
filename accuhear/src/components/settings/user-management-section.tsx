"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type UserRecord = {
  id: string;
  email: string;
  role: "ADMINISTRATOR" | "EMPLOYEE";
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
};

type EditableUser = UserRecord & {
  nextEmail: string;
  nextRole: "ADMINISTRATOR" | "EMPLOYEE";
  newPassword: string;
};

function formatRole(role: UserRecord["role"]) {
  return role === "ADMINISTRATOR" ? "Administrator" : "Employee";
}

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString();
}

function RoleBadge({ role }: { role: UserRecord["role"] }) {
  return (
    <span
      className={
        role === "ADMINISTRATOR"
          ? "inline-flex h-5 items-center rounded-full bg-[rgba(201,70,70,0.12)] px-2 text-[10px] font-display font-semibold uppercase tracking-[0.05em] text-danger"
          : "inline-flex h-5 items-center rounded-full bg-[rgba(31,149,184,0.12)] px-2 text-[10px] font-display font-semibold uppercase tracking-[0.05em] text-brand-blue"
      }
    >
      {formatRole(role)}
    </span>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full bg-surface-1 px-2.5 py-1">
      <span className="font-display text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">{label}</span>
      <span className="ml-1.5 text-[11px] text-ink-muted">{value}</span>
    </div>
  );
}

export function UserManagementSection({ active }: { active: boolean }) {
  const [users, setUsers] = useState<EditableUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    role: "EMPLOYEE" as UserRecord["role"],
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    setForbidden(false);

    try {
      const response = await fetch("/api/users", { cache: "no-store" });
      const payload = await response.json().catch(() => ({ error: "Unable to load users." }));
      if (response.status === 403) {
        setForbidden(true);
        setUsers([]);
        return;
      }
      if (!response.ok) {
        throw new Error(payload.error || "Unable to load users.");
      }

      setCurrentUserId(typeof payload.currentUserId === "string" ? payload.currentUserId : null);
      setUsers(
        ((payload.users ?? []) as UserRecord[]).map((user) => ({
          ...user,
          nextEmail: user.email,
          nextRole: user.role,
          newPassword: "",
        }))
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    void loadUsers();
  }, [active, loadUsers]);

  useEffect(() => {
    if (!message) return;
    const timeoutId = window.setTimeout(() => setMessage(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [message]);

  if (!active) {
    return null;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] px-[14px] py-3 shadow-[0_1px_3px_rgba(38,34,96,0.06),0_0_0_1px_rgba(38,34,96,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="section-title">Create User</div>
            <p className="mt-1 text-[13px] text-ink-muted">Add employee and administrator logins backed by the app database.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void loadUsers()} disabled={loading}>
            Refresh
          </Button>
        </div>

        {forbidden ? (
          <Alert className="mt-4 border-warning/25 bg-warning/10 text-warning">
            <AlertDescription>Administrator access is required to manage users.</AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_180px_minmax(220px,0.9fr)_auto]">
              <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                Email
                <Input
                  className="mt-1"
                  type="email"
                  value={newUser.email}
                  onChange={(event) => setNewUser((current) => ({ ...current, email: event.target.value }))}
                />
              </Label>
              <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                Role
                <Select value={newUser.role} onValueChange={(value) => value && setNewUser((current) => ({ ...current, role: value as UserRecord["role"] }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMINISTRATOR">Administrator</SelectItem>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </Label>
              <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                Temporary password
                <Input
                  className="mt-1"
                  type="password"
                  value={newUser.password}
                  onChange={(event) => setNewUser((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Set password"
                />
              </Label>
              <div className="flex items-end">
                <Button
                  type="button"
                  disabled={creating}
                  onClick={async () => {
                    setCreating(true);
                    setError(null);
                    setMessage(null);
                    try {
                      const response = await fetch("/api/users", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(newUser),
                      });
                      const payload = await response.json().catch(() => ({ error: "Unable to create user." }));
                      if (!response.ok) {
                        throw new Error(payload.error || "Unable to create user.");
                      }

                      setNewUser({ email: "", password: "", role: "EMPLOYEE" });
                      setMessage("User created.");
                      await loadUsers();
                    } catch (createError) {
                      setError(createError instanceof Error ? createError.message : "Unable to create user.");
                    } finally {
                      setCreating(false);
                    }
                  }}
                >
                  {creating ? "Creating..." : "Create User"}
                </Button>
              </div>
            </div>
          </>
        )}
      </section>

      {!forbidden ? (
        <section className="rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] px-[14px] py-3 shadow-[0_1px_3px_rgba(38,34,96,0.06),0_0_0_1px_rgba(38,34,96,0.04)]">
          <div className="section-title">Existing Users</div>
          <div className="mt-3 space-y-2">
            {loading ? (
              <div className="text-[13px] text-ink-muted">Loading users...</div>
            ) : users.length ? (
              users.map((user) => (
                <div
                  key={user.id}
                  className="rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-surface-1/45 px-[14px] py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[rgba(38,34,96,0.08)] pb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-display text-[14px] font-semibold text-ink-strong">{user.email}</div>
                        <RoleBadge role={user.role} />
                        {currentUserId === user.id ? (
                          <span className="inline-flex h-5 items-center rounded-full bg-[rgba(30,155,108,0.12)] px-2 text-[10px] font-display font-semibold uppercase tracking-[0.05em] text-success">
                            Current Session
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <MetaChip label="Created" value={formatDate(user.createdAt)} />
                        <MetaChip label="Last Login" value={formatDate(user.lastLoginAt)} />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Button
                        type="button"
                        disabled={savingUserId === user.id}
                        onClick={async () => {
                          setSavingUserId(user.id);
                          setError(null);
                          setMessage(null);
                          try {
                            const response = await fetch(`/api/users/${user.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                email: user.nextEmail,
                                role: user.nextRole,
                                password: user.newPassword,
                              }),
                            });
                            const payload = await response.json().catch(() => ({ error: "Unable to update user." }));
                            if (!response.ok) {
                              throw new Error(payload.error || "Unable to update user.");
                            }

                            setMessage("User updated.");
                            await loadUsers();
                          } catch (saveError) {
                            setError(saveError instanceof Error ? saveError.message : "Unable to update user.");
                          } finally {
                            setSavingUserId(null);
                          }
                        }}
                      >
                        {savingUserId === user.id ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-3 pt-3 xl:grid-cols-[minmax(0,1.6fr)_180px_minmax(220px,0.95fr)]">
                    <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                      Email
                      <Input
                        className="mt-1"
                        type="email"
                        value={user.nextEmail}
                        onChange={(event) =>
                          setUsers((current) =>
                            current.map((entry) =>
                              entry.id === user.id ? { ...entry, nextEmail: event.target.value } : entry
                            )
                          )
                        }
                      />
                    </Label>
                    <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                      Role
                      <Select
                        value={user.nextRole}
                        onValueChange={(value) =>
                          value &&
                          setUsers((current) =>
                            current.map((entry) =>
                              entry.id === user.id ? { ...entry, nextRole: value as UserRecord["role"] } : entry
                            )
                          )
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMINISTRATOR">Administrator</SelectItem>
                          <SelectItem value="EMPLOYEE">Employee</SelectItem>
                        </SelectContent>
                      </Select>
                    </Label>
                    <Label className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">
                      Reset Password
                      <Input
                        className="mt-1"
                        type="password"
                        placeholder="Leave blank to keep current password"
                        value={user.newPassword}
                        onChange={(event) =>
                          setUsers((current) =>
                            current.map((entry) =>
                              entry.id === user.id ? { ...entry, newPassword: event.target.value } : entry
                            )
                          )
                        }
                      />
                    </Label>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-[13px] text-ink-muted">No users created yet.</div>
            )}
          </div>
        </section>
      ) : null}

      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
