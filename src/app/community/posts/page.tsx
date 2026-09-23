"use client";

import { useState } from "react";
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
} from "@/components/ui";
import {
  getCommunityPosts,
  moderatePost,
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getReportedItems,
  resolveReport,
  dismissReport,
} from "@/lib/api";
import {
  appTypeLabel,
  appTypeBadgeTone,
  contentStatusLabel,
  contentStatusTone,
  relativeTime,
} from "@/lib/labels";
import type { CommunityPost, FaithGroup, ReportedItem } from "@/types";

type Tab = "feed" | "groups" | "reports";

export default function CommunityPage() {
  const [tab, setTab] = useState<Tab>("feed");
  const reports = useQuery({
    queryKey: ["reports"],
    queryFn: getReportedItems,
  });
  const openReports =
    reports.data?.filter((r) => r.status === "open").length ?? 0;

  return (
    <Shell>
      <div className="mb-4 flex flex-wrap gap-2">
        <TabBtn active={tab === "feed"} onClick={() => setTab("feed")}>
          💬 Posts Feed
        </TabBtn>
        <TabBtn active={tab === "groups"} onClick={() => setTab("groups")}>
          👥 Faith Groups
        </TabBtn>
        <TabBtn active={tab === "reports"} onClick={() => setTab("reports")}>
          ⚠️ Reported Content
          {openReports > 0 && (
            <span className="ml-2 rounded-pill bg-red-500 px-2 py-0.5 font-manrope text-xs font-bold text-white">
              {openReports}
            </span>
          )}
        </TabBtn>
      </div>

      {tab === "feed" && <PostsFeed />}
      {tab === "groups" && <GroupsTab />}
      {tab === "reports" && <ReportsTab />}
    </Shell>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-pill px-5 py-2.5 font-manrope text-sm font-semibold shadow-card transition ${
        active
          ? "bg-primary-gradient text-white"
          : "bg-surface-card text-text-muted hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}

// ================= Posts Feed =================

function PostsFeed() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [appType, setAppType] = useState("");
  const [status, setStatus] = useState("");
  const [groupId, setGroupId] = useState("");
  const [confirmBan, setConfirmBan] = useState<CommunityPost | null>(null);

  const posts = useQuery({
    queryKey: ["posts", { search, appType, status, groupId }],
    queryFn: () =>
      getCommunityPosts({
        search: search || undefined,
        app_type: (appType || undefined) as CommunityPost["app_type"] | undefined,
        status: (status || undefined) as CommunityPost["status"] | undefined,
        group_id: groupId || undefined,
      }),
  });
  const groups = useQuery({ queryKey: ["groups"], queryFn: getGroups });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["posts"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
  };

  const moderate = useMutation({
    mutationFn: (vars: { id: string; action: "approve" | "hide" | "delete" }) =>
      moderatePost(vars.id, vars.action),
    onSuccess: invalidate,
  });

  return (
    <>
      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <input
            className={inputClass}
            placeholder="Search post content…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            value={appType}
            onChange={setAppType}
            placeholder="App type: all"
            options={[
              { value: "adult", label: "Adult App" },
              { value: "kids", label: "Kids App" },
            ]}
          />
          <Select
            value={status}
            onChange={setStatus}
            placeholder="Status: all"
            options={[
              { value: "pending", label: "Pending review" },
              { value: "approved", label: "Approved" },
              { value: "hidden", label: "Hidden" },
              { value: "flagged", label: "Flagged" },
            ]}
          />
          <Select
            value={groupId}
            onChange={setGroupId}
            placeholder="Group: all"
            options={(groups.data ?? []).map((g) => ({
              value: g.id,
              label: g.name,
            }))}
          />
        </div>
      </Card>

      {posts.isLoading ? (
        <Card>
          <Spinner />
        </Card>
      ) : (posts.data ?? []).length === 0 ? (
        <Card>
          <EmptyState message="No posts match these filters." />
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.data!.map((p) => (
            <Card key={p.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-primary/10 font-urbanist text-sm font-bold text-primary">
                  {p.author_name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-urbanist text-sm font-semibold text-text-primary">
                      {p.author_name}
                    </p>
                    <Badge tone={appTypeBadgeTone[p.app_type]}>
                      {appTypeLabel[p.app_type]}
                    </Badge>
                    {p.group_name && (
                      <Badge tone="bg-surface-bg text-text-muted">
                        {p.group_name}
                      </Badge>
                    )}
                    <Badge tone={contentStatusTone[p.status]}>
                      {contentStatusLabel[p.status]}
                    </Badge>
                    {p.report_count > 0 && (
                      <Badge tone="bg-red-100 text-red-600">
                        ⚑ {p.report_count} reports
                      </Badge>
                    )}
                    <span className="ml-auto font-manrope text-xs text-text-light">
                      {relativeTime(p.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 font-manrope text-sm leading-relaxed text-text-body">
                    {p.content}
                  </p>
                  <div className="mt-2 flex items-center gap-4 font-manrope text-xs text-text-light">
                    <span>❤️ {p.like_count}</span>
                    <span>💬 {p.comment_count}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="danger"
                      onClick={() => setConfirmBan(p)}
                    >
                      Ban user
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        moderate.mutate({ id: p.id, action: "delete" })
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!confirmBan}
        onClose={() => setConfirmBan(null)}
        title="Ban user"
      >
        <p className="font-manrope text-sm text-text-body">
          Ban <strong>{confirmBan?.author_name}</strong> from creating posts or
          comments across {confirmBan?.app_type === "kids" ? "the Kids App" : "the Adult App"}?
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmBan(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (confirmBan)
                updateUserStatusFromPost(confirmBan.author_id, qc);
              setConfirmBan(null);
            }}
          >
            Ban user
          </Button>
        </div>
      </Modal>
    </>
  );
}

/** Ban = suspend the author's account in the mock store. */
function updateUserStatusFromPost(authorId: string, qc: ReturnType<typeof useQueryClient>) {
  import("@/lib/api").then(({ updateUserStatus }) =>
    updateUserStatus([authorId], "suspended").then(() =>
      qc.invalidateQueries({ queryKey: ["users"] })
    )
  );
}

// ================= Groups =================

function GroupsTab() {
  const qc = useQueryClient();
  const groups = useQuery({ queryKey: ["groups"], queryFn: getGroups });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FaithGroup | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Fellowship",
    is_adult_only: false,
    is_kid_safe: true,
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (editing) return updateGroup(editing.id, form);
      return createGroup(form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      setFormOpen(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteGroup(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setForm({
              name: "",
              description: "",
              category: "Fellowship",
              is_adult_only: false,
              is_kid_safe: true,
            });
            setFormOpen(true);
          }}
        >
          ＋ Create Group
        </Button>
      </div>

      {groups.isLoading ? (
        <Card>
          <Spinner />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(groups.data ?? []).map((g) => (
            <Card key={g.id} className="flex flex-col">
              <div className="flex items-center justify-between">
                <Badge tone="bg-primary/10 text-primary">{g.category}</Badge>
                <div className="flex gap-1.5">
                  {g.is_adult_only && (
                    <Badge tone="bg-red-50 text-red-500">18+ only</Badge>
                  )}
                  {g.is_kid_safe && (
                    <Badge tone="bg-purple-100 text-purple-700">
                      🧒 Kid-safe
                    </Badge>
                  )}
                </div>
              </div>
              <h3 className="mt-3 font-urbanist text-base font-bold text-text-primary">
                {g.name}
              </h3>
              <p className="mt-1 line-clamp-2 flex-1 font-manrope text-xs leading-relaxed text-text-body">
                {g.description}
              </p>
              <div className="mt-3 font-manrope text-xs text-text-muted">
                👥 {g.member_count.toLocaleString()} members · Activity{" "}
                {g.activity_score}%
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-pill bg-surface-bg">
                <div
                  className="h-full rounded-pill bg-primary-gradient"
                  style={{ width: `${g.activity_score}%` }}
                />
              </div>
              <div className="mt-4 flex gap-2 border-t border-text-faint/10 pt-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditing(g);
                    setForm({
                      name: g.name,
                      description: g.description,
                      category: g.category,
                      is_adult_only: g.is_adult_only,
                      is_kid_safe: g.is_kid_safe,
                    });
                    setFormOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    updateGroup(g.id, { is_kid_safe: !g.is_kid_safe }).then(() =>
                      qc.invalidateQueries({ queryKey: ["groups"] })
                    )
                  }
                >
                  {g.is_kid_safe ? "Unset kid-safe" : "Set kid-safe"}
                </Button>
                <Button
                  variant="danger"
                  className="ml-auto"
                  onClick={() => deleteMut.mutate(g.id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Group" : "Create Group"}
        wide
      >
        <div className="space-y-4">
          <Field label="Name">
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Description">
            <textarea
              className={`${inputClass} min-h-[80px]`}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </Field>
          <Field label="Category">
            <Select
              value={form.category}
              onChange={(v) => setForm({ ...form, category: v })}
              options={[
                { value: "Bible Study", label: "Bible Study" },
                { value: "Fellowship", label: "Fellowship" },
                { value: "Prayer", label: "Prayer" },
                { value: "Youth", label: "Youth" },
                { value: "Kids", label: "Kids" },
              ]}
            />
          </Field>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 font-manrope text-sm text-text-body">
              <input
                type="checkbox"
                checked={form.is_adult_only}
                onChange={(e) =>
                  setForm({ ...form, is_adult_only: e.target.checked })
                }
                className="h-4 w-4 accent-[#25596E]"
              />
              Adult-only (18+)
            </label>
            <label className="flex items-center gap-2 font-manrope text-sm text-text-body">
              <input
                type="checkbox"
                checked={form.is_kid_safe}
                onChange={(e) =>
                  setForm({ ...form, is_kid_safe: e.target.checked })
                }
                className="h-4 w-4 accent-[#25596E]"
              />
              Kid-safe (moderated)
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => saveMut.mutate()} disabled={!form.name}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ================= Reports =================

function ReportsTab() {
  const qc = useQueryClient();
  const reports = useQuery({ queryKey: ["reports"], queryFn: getReportedItems });
  const [filter, setFilter] = useState<"open" | "resolved" | "dismissed" | "">("");

  const list = (reports.data ?? []).filter((r) =>
    filter ? r.status === filter : true
  );

  const act = useMutation({
    mutationFn: (vars: { id: string; action: "resolve" | "dismiss" }) =>
      vars.action === "resolve"
        ? resolveReport(vars.id)
        : dismissReport(vars.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });

  return (
    <>
      <Card className="mb-4">
        <div className="flex flex-wrap gap-2">
          {(["", "open", "resolved", "dismissed"] as const).map((f) => (
            <button
              key={f || "all"}
              onClick={() => setFilter(f)}
              className={`rounded-pill px-4 py-1.5 font-manrope text-xs font-semibold capitalize transition ${
                filter === f
                  ? "bg-primary text-white"
                  : "bg-surface-bg text-text-muted hover:text-text-primary"
              }`}
            >
              {f || "All"}
            </button>
          ))}
        </div>
      </Card>

      {reports.isLoading ? (
        <Card>
          <Spinner />
        </Card>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState icon="🛡️" message="Queue is clear — no reports here." />
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((r) => (
            <ReportRow
              key={r.id}
              report={r}
              onAction={(action) => act.mutate({ id: r.id, action })}
            />
          ))}
        </div>
      )}
    </>
  );
}

function ReportRow({
  report,
  onAction,
}: {
  report: ReportedItem;
  onAction: (action: "resolve" | "dismiss") => void;
}) {
  const tone =
    report.status === "open"
      ? "bg-amber-100 text-amber-700"
      : report.status === "resolved"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-text-faint/20 text-text-muted";

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={tone} className="capitalize">
              {report.status}
            </Badge>
            <Badge tone={appTypeBadgeTone[report.app_type]}>
              {appTypeLabel[report.app_type]}
            </Badge>
            <Badge tone="bg-surface-bg text-text-muted">{report.reason}</Badge>
            <span className="font-manrope text-xs text-text-light">
              {relativeTime(report.created_at)}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 font-manrope text-sm text-text-body">
            “{report.post_excerpt}”
          </p>
          <p className="mt-1 font-manrope text-xs text-text-light">
            Reported by {report.reporter_name} · post {report.post_id}
          </p>
        </div>
        {report.status === "open" && (
          <div className="flex shrink-0 gap-2">
            <Button
              variant="success"
              onClick={() => onAction("resolve")}
            >
              Resolve
            </Button>
            <Button
              variant="ghost"
              onClick={() => onAction("dismiss")}
            >
              Dismiss
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
