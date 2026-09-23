"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shell } from "@/components/Shell";
import {
  Button,
  Badge,
  Card,
  Modal,
  Field,
  Select,
  inputClass,
  EmptyState,
  Spinner,
  Pagination,
} from "@/components/ui";
import {
  getUsers,
  updateUserStatus,
  deleteUser,
  resetUserPassword,
} from "@/lib/api";
import { downloadCSV } from "@/lib/csv";
import {
  appTypeLabel,
  appTypeBadgeTone,
  userStatusLabel,
  userStatusTone,
  formatDate,
  relativeTime,
} from "@/lib/labels";
import type { User, UserStatus } from "@/types";

const PAGE_SIZE = 8;

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [appType, setAppType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<User | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["users", { search, appType, status }],
    queryFn: () =>
      getUsers({
        search: search || undefined,
        app_type: (appType || undefined) as User["app_type"] | undefined,
        status: (status || undefined) as UserStatus | undefined,
      }),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["users"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
  };

  const statusMut = useMutation({
    mutationFn: (vars: { ids: string[]; status: UserStatus }) =>
      updateUserStatus(vars.ids, vars.status),
    onSuccess: () => {
      invalidate();
      setSelected(new Set());
    },
  });
  const deleteMut = useMutation({
    mutationFn: (ids: string[]) => deleteUser(ids),
    onSuccess: () => {
      invalidate();
      setSelected(new Set());
      setConfirmDelete(false);
      setDetail(null);
    },
  });
  const resetMut = useMutation({
    mutationFn: (id: string) => resetUserPassword(id),
    onSuccess: (res) => setTempPassword(res.tempPassword),
  });

  const filtered = data ?? [];
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );
  const allPageSelected =
    pageRows.length > 0 && pageRows.every((u) => selected.has(u.id));

  const toggleAll = () => {
    const next = new Set(selected);
    if (allPageSelected) pageRows.forEach((u) => next.delete(u.id));
    else pageRows.forEach((u) => next.add(u.id));
    setSelected(next);
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const exportCSV = () => {
    downloadCSV(
      "users-export.csv",
      filtered.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone ?? "",
        app_type: u.app_type,
        status: u.status,
        age_group: u.age_group,
        email_verified: u.email_verified,
        streak_days: u.streak_days,
        parent_id: u.parent_id ?? "",
        groups: u.joined_groups.join(";"),
        signup_date: u.signup_date,
        last_active: u.last_active,
      }))
    );
  };

  return (
    <Shell>
      {/* Filter bar */}
      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <input
            className={inputClass}
            placeholder="Search name, email, phone…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Select
            value={appType}
            onChange={(v) => {
              setAppType(v);
              setPage(1);
            }}
            placeholder="App type: all"
            options={[
              { value: "adult", label: "Adult App" },
              { value: "kids", label: "Kids App" },
            ]}
          />
          <Select
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            placeholder="Status: all"
            options={[
              { value: "active", label: "Active" },
              { value: "suspended", label: "Suspended" },
            ]}
          />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={exportCSV} className="flex-1">
              ⬇ Export CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-card bg-primary p-3 text-white shadow-card">
          <span className="px-2 font-manrope text-sm font-semibold">
            {selected.size} selected
          </span>
          <button
            className="rounded-pill bg-white/15 px-3 py-1.5 font-manrope text-xs font-semibold hover:bg-white/25"
            onClick={() =>
              statusMut.mutate({ ids: [...selected], status: "suspended" })
            }
          >
            Suspend
          </button>
          <button
            className="rounded-pill bg-white/15 px-3 py-1.5 font-manrope text-xs font-semibold hover:bg-white/25"
            onClick={() => statusMut.mutate({ ids: [...selected], status: "active" })}
          >
            Reactivate
          </button>
          <button
            className="rounded-pill bg-red-500/80 px-3 py-1.5 font-manrope text-xs font-semibold hover:bg-red-500"
            onClick={() => setConfirmDelete(true)}
          >
            Delete
          </button>
        </div>
      )}

      {/* Table */}
      <Card className="overflow-x-auto">
        {isLoading ? (
          <Spinner />
        ) : pageRows.length === 0 ? (
          <EmptyState message="No users match these filters." />
        ) : (
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-text-faint/20">
                <th className="w-8 pb-3">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 accent-[#25596E]"
                  />
                </th>
                <Th>User</Th>
                <Th>App</Th>
                <Th>Status</Th>
                <Th>Streak</Th>
                <Th>Last Active</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {pageRows.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-text-faint/10 transition hover:bg-surface-bg/60"
                >
                  <td className="py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(u.id)}
                      onChange={() => toggleOne(u.id)}
                      className="h-4 w-4 accent-[#25596E]"
                    />
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-pill bg-primary/10 font-urbanist text-sm font-bold text-primary">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-urbanist text-sm font-semibold text-text-primary">
                          {u.name}
                        </p>
                        <p className="font-manrope text-xs text-text-muted">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge tone={appTypeBadgeTone[u.app_type]}>
                      {appTypeLabel[u.app_type]}
                    </Badge>
                  </td>
                  <td>
                    <Badge tone={userStatusTone[u.status]}>
                      {userStatusLabel[u.status]}
                    </Badge>
                  </td>
                  <td className="font-manrope text-sm text-text-body">
                    {u.streak_days > 0 ? `🔥 ${u.streak_days}d` : "—"}
                  </td>
                  <td className="font-manrope text-xs text-text-muted">
                    {relativeTime(u.last_active)}
                  </td>
                  <td>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setDetail(u);
                        setTempPassword(null);
                      }}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} pageCount={pageCount} onPage={setPage} />
      </Card>

      {/* Detail modal */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="User Profile"
        wide
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-pill bg-primary-gradient font-urbanist text-xl font-bold text-white">
                {detail.name.charAt(0)}
              </div>
              <div>
                <p className="font-urbanist text-lg font-bold text-text-primary">
                  {detail.name}
                </p>
                <p className="font-manrope text-sm text-text-muted">
                  {detail.email} {detail.phone ? `· ${detail.phone}` : ""}
                </p>
                <div className="mt-1 flex gap-2">
                  <Badge tone={appTypeBadgeTone[detail.app_type]}>
                    {appTypeLabel[detail.app_type]}
                  </Badge>
                  <Badge tone={userStatusTone[detail.status]}>
                    {userStatusLabel[detail.status]}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-card bg-surface-bg p-4 font-manrope text-sm">
              <Info label="Age group" value={detail.age_group} />
              <Info label="Streak" value={`${detail.streak_days} days`} />
              <Info label="Joined" value={formatDate(detail.signup_date)} />
              <Info
                label="Last active"
                value={relativeTime(detail.last_active)}
              />
              {detail.app_type === "kids" && (
                <Info
                  label="Parent / guardian"
                  value={
                    detail.parent_id
                      ? (data ?? []).find((p) => p.id === detail.parent_id)
                          ?.name ?? detail.parent_id
                      : "—"
                  }
                />
              )}
              <Info
                label="Groups"
                value={`${detail.joined_groups.length} group(s)`}
              />
            </div>

            {detail.app_type === "kids" && (
              <p className="rounded-card bg-amber-50 px-4 py-3 font-manrope text-xs text-amber-700">
                ⚠️ Kids account — messaging data is not exposed and only
                guardian-linked fields are editable.
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              {detail.status !== "banned" && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    statusMut.mutate({ ids: [detail.id], status: "suspended" });
                    setDetail(null);
                  }}
                >
                  Suspend
                </Button>
              )}
              {detail.status !== "active" && (
                <Button
                  variant="success"
                  onClick={() => {
                    statusMut.mutate({ ids: [detail.id], status: "active" });
                    setDetail(null);
                  }}
                >
                  Reactivate
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => resetMut.mutate(detail.id)}
              >
                Reset password
              </Button>
              <Button
                variant="danger"
                onClick={() => setConfirmDelete(true)}
              >
                Delete (GDPR)
              </Button>
            </div>

            {tempPassword && (
              <p className="rounded-card bg-emerald-50 px-4 py-3 font-manrope text-sm text-emerald-700">
                Temporary password: <strong>{tempPassword}</strong> — share
                securely with the user.
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Confirm delete */}
      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete account(s)"
      >
        <p className="font-manrope text-sm text-text-body">
          This performs a GDPR-compliant erasure of{" "}
          <strong>{selected.size > 0 ? selected.size : 1}</strong> account(s)
          and cannot be undone. Personal data will be removed from the app
          database and backups.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteMut.mutate([...selected, detail?.id ?? ""])}
          >
            Delete permanently
          </Button>
        </div>
      </Modal>
    </Shell>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="pb-3 font-manrope text-xs font-semibold uppercase tracking-wide text-text-muted">
      {children}
    </th>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-text-light">{label}</p>
      <p className="mt-0.5 font-semibold capitalize text-text-primary">
        {value}
      </p>
    </div>
  );
}
