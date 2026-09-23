"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shell } from "@/components/Shell";
import {
  Button,
  Badge,
  Card,
  Modal,
  Select,
  inputClass,
  EmptyState,
  Spinner,
  Pagination,
} from "@/components/ui";
import {
  getPrayerRequests,
  moderatePrayerRequest,
} from "@/lib/api";
import {
  appTypeLabel,
  appTypeBadgeTone,
  relativeTime,
} from "@/lib/labels";
import type { PrayerRequest } from "@/types";

const PAGE_SIZE = 8;

export default function PrayerRequestsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [appType, setAppType] = useState("");
  const [status, setStatus] = useState("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<PrayerRequest | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["prayer-requests", { search, appType, status, flaggedOnly }],
    queryFn: () =>
      getPrayerRequests({
        search: search || undefined,
        app_type: (appType || undefined) as PrayerRequest["app_type"] | undefined,
        status: (status || undefined) as PrayerRequest["status"] | undefined,
        flagged: flaggedOnly ? "only" : undefined,
      }),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["prayer-requests"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
  };

  const moderate = useMutation({
    mutationFn: (vars: {
      id: string;
      action: "approve" | "hide" | "delete" | "mark_answered";
    }) => moderatePrayerRequest(vars.id, vars.action),
    onSuccess: () => {
      invalidate();
      setDetail(null);
    },
  });


  const filtered = data ?? [];
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusTone = (s: PrayerRequest["status"]) =>
    s === "open"
      ? "bg-amber-100 text-amber-700"
      : s === "answered"
      ? "bg-emerald-100 text-emerald-700"
      : s === "hidden"
      ? "bg-red-100 text-red-600"
      : "bg-text-faint/20 text-text-muted";

  return (
    <Shell>
      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <input
            className={inputClass}
            placeholder="Search requests…"
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
              { value: "open", label: "Open" },
              { value: "answered", label: "Answered / Testimony" },
              { value: "archived", label: "Archived" },
              { value: "hidden", label: "Hidden" },
            ]}
          />
          <label className="flex items-center gap-2 rounded-card border border-text-faint/40 bg-white px-3 font-manrope text-sm text-text-body">
            <input
              type="checkbox"
              checked={flaggedOnly}
              onChange={(e) => {
                setFlaggedOnly(e.target.checked);
                setPage(1);
              }}
              className="h-4 w-4 accent-[#25596E]"
            />
            Flagged only
          </label>
        </div>
      </Card>

      {isLoading ? (
        <Card>
          <Spinner />
        </Card>
      ) : pageRows.length === 0 ? (
        <Card>
          <EmptyState icon="🙏" message="No prayer requests match these filters." />
        </Card>
      ) : (
        <div className="space-y-3">
          {pageRows.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-urbanist text-sm font-semibold text-text-primary">
                      {r.author_name}
                    </p>
                    <Badge tone={appTypeBadgeTone[r.app_type]}>
                      {appTypeLabel[r.app_type]}
                    </Badge>
                    <Badge tone={statusTone(r.status)} className="capitalize">
                      {r.status}
                    </Badge>
                    {r.is_flagged && (
                      <Badge tone="bg-red-100 text-red-600">
                        ⚑ {r.flagged_reason ?? "Flagged"}
                      </Badge>
                    )}
                    <span className="ml-auto font-manrope text-xs text-text-light">
                      {relativeTime(r.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 font-manrope text-sm leading-relaxed text-text-body">
                    {r.request_text}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-4 font-manrope text-xs text-text-light">
                    <span>❤️ {r.like_count} likes</span>
                    <span>🤲 {r.support_count} praying</span>
                    <span>
                      💬{" "}
                      {r.commenters.length > 0
                        ? `${r.commenters.length} commenters`
                        : "No comments"}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setDetail(r)}
                  >
                    View
                  </Button>
                  {r.status !== "answered" && (
                    <Button
                      variant="success"
                      onClick={() =>
                        moderate.mutate({
                          id: r.id,
                          action: "mark_answered",
                        })
                      }
                    >
                      Mark answered
                    </Button>
                  )}
                  {r.status !== "hidden" && (
                    <Button
                      variant="danger"
                      onClick={() => moderate.mutate({ id: r.id, action: "hide" })}
                    >
                      Hide
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    onClick={() => moderate.mutate({ id: r.id, action: "delete" })}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-2">
        <Card>
          <Pagination page={page} pageCount={pageCount} onPage={setPage} />
        </Card>
      </div>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Prayer Request"
        wide
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={appTypeBadgeTone[detail.app_type]}>
                {appTypeLabel[detail.app_type]}
              </Badge>
              <Badge tone={statusTone(detail.status)} className="capitalize">
                {detail.status}
              </Badge>
            </div>
            <p className="font-playfair text-base italic leading-relaxed text-text-body">
              “{detail.request_text}”
            </p>
            <div className="grid grid-cols-3 gap-3 rounded-card bg-surface-bg p-4 text-center">
              <div>
                <p className="font-urbanist text-xl font-bold text-primary">
                  {detail.like_count}
                </p>
                <p className="font-manrope text-xs text-text-muted">Likes</p>
              </div>
              <div>
                <p className="font-urbanist text-xl font-bold text-primary">
                  {detail.support_count}
                </p>
                <p className="font-manrope text-xs text-text-muted">Praying</p>
              </div>
              <div>
                <p className="font-urbanist text-xl font-bold text-primary">
                  {detail.commenters.length}
                </p>
                <p className="font-manrope text-xs text-text-muted">
                  Commenters
                </p>
              </div>
            </div>
            {detail.commenters.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {detail.commenters.map((c) => (
                  <Badge key={c} tone="bg-surface-bg text-text-muted">
                    {c}
                  </Badge>
                ))}
              </div>
            )}
            <p className="font-manrope text-xs text-text-light">
              Posted by {detail.author_name} · {relativeTime(detail.created_at)}
            </p>
          </div>
        )}
      </Modal>
    </Shell>
  );
}
