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
  getPrayers,
  createPrayer,
  updatePrayer,
  deletePrayer,
} from "@/lib/api";
import {
  appTypeLabel,
  appTypeBadgeTone,
  contentStatusLabel,
  contentStatusTone,
  prayerCategoryLabel,
  formatDate,
} from "@/lib/labels";
import type { Prayer } from "@/types";

const PAGE_SIZE = 6;

export default function PrayersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Prayer | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [preview, setPreview] = useState<Prayer | null>(null);
  const [form, setForm] = useState({
    title: "",
    prayer_text: "",
    kid_friendly_text: "",
    category: "morning" as Prayer["category"],
    app_type: "both" as Prayer["app_type"],
    publish_date: new Date().toISOString().slice(0, 10),
    status: "draft" as Prayer["status"],
  });

  const { data, isLoading } = useQuery({
    queryKey: ["prayers", { search, category, status }],
    queryFn: () => getPrayers(),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["prayers"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        prayer_text: form.prayer_text,
        kid_friendly_text: form.kid_friendly_text || undefined,
        category: form.category,
        app_type: form.app_type,
        publish_date: form.publish_date,
        status: form.status,
      };
      if (editing) return updatePrayer(editing.id, payload);
      return createPrayer(payload);
    },
    onSuccess: () => {
      invalidate();
      setFormOpen(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deletePrayer(id),
    onSuccess: invalidate,
  });

  const filtered = useMemo(() => {
    return (data ?? []).filter((p) => {
      if (search && !`${p.title} ${p.prayer_text}`.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (category && p.category !== category) return false;
      if (status && p.status !== status) return false;
      return true;
    });
  }, [data, search, category, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openEdit = (p: Prayer) => {
    setEditing(p);
    setForm({
      title: p.title,
      prayer_text: p.prayer_text,
      kid_friendly_text: p.kid_friendly_text ?? "",
      category: p.category,
      app_type: p.app_type,
      publish_date: p.publish_date,
      status: p.status,
    });
    setFormOpen(true);
  };

  return (
    <Shell>
      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <input
            className={inputClass}
            placeholder="Search prayers…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Select
            value={category}
            onChange={(v) => {
              setCategory(v);
              setPage(1);
            }}
            placeholder="Category: all"
            options={Object.entries(prayerCategoryLabel).map(([value, label]) => ({
              value,
              label,
            }))}
          />
          <Select
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            placeholder="Status: all"
            options={[
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
              { value: "archived", label: "Archived" },
            ]}
          />
          <Button
            onClick={() => {
              setEditing(null);
              setForm({
                title: "",
                prayer_text: "",
                kid_friendly_text: "",
                category: "morning",
                app_type: "both",
                publish_date: new Date().toISOString().slice(0, 10),
                status: "draft",
              });
              setFormOpen(true);
            }}
          >
            ＋ Add Prayer
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <Card>
          <Spinner />
        </Card>
      ) : pageRows.length === 0 ? (
        <Card>
          <EmptyState message="No prayers match these filters." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pageRows.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <div className="flex items-center justify-between">
                <Badge tone={appTypeBadgeTone[p.app_type]}>
                  {appTypeLabel[p.app_type]}
                </Badge>
                <Badge tone={contentStatusTone[p.status]}>
                  {contentStatusLabel[p.status]}
                </Badge>
              </div>
              <h3 className="mt-3 font-urbanist text-base font-bold text-text-primary">
                {p.title}
              </h3>
              <p className="mt-2 flex-1 font-playfair text-sm italic leading-relaxed text-text-body">
                “{p.prayer_text.length > 140 ? p.prayer_text.slice(0, 140) + "…" : p.prayer_text}”
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Badge tone="bg-primary/10 text-primary">
                  {prayerCategoryLabel[p.category] ?? p.category}
                </Badge>
                {p.kid_friendly_text && (
                  <Badge tone="bg-purple-100 text-purple-700">
                    🧒 Kid version
                  </Badge>
                )}
              </div>
              <p className="mt-2 font-manrope text-xs text-text-light">
                📅 {formatDate(p.publish_date)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-text-faint/10 pt-3">
                <Button variant="secondary" onClick={() => setPreview(p)}>
                  Preview
                </Button>
                <Button variant="ghost" onClick={() => openEdit(p)}>
                  Edit
                </Button>
                {p.status === "published" ? (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      updatePrayer(p.id, { status: "archived" }).then(invalidate)
                    }
                  >
                    Archive
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      updatePrayer(p.id, { status: "published" }).then(invalidate)
                    }
                  >
                    Publish
                  </Button>
                )}
                <Button
                  variant="danger"
                  className="ml-auto"
                  onClick={() => deleteMut.mutate(p.id)}
                >
                  Delete
                </Button>
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
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Prayer" : "Add Prayer"}
        wide
      >
        <div className="space-y-4">
          <Field label="Title">
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <Field label="Prayer text">
            <textarea
              className={`${inputClass} min-h-[110px]`}
              value={form.prayer_text}
              onChange={(e) => setForm({ ...form, prayer_text: e.target.value })}
            />
          </Field>
          <Field
            label="Kid-friendly version (optional)"
            hint="Shown to Kids App users when present — use simple words and short sentences."
          >
            <textarea
              className={`${inputClass} min-h-[80px]`}
              value={form.kid_friendly_text}
              onChange={(e) =>
                setForm({ ...form, kid_friendly_text: e.target.value })
              }
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select
                value={form.category}
                onChange={(v) =>
                  setForm({ ...form, category: v as Prayer["category"] })
                }
                options={Object.entries(prayerCategoryLabel).map(
                  ([value, label]) => ({ value, label })
                )}
              />
            </Field>
            <Field label="App type">
              <Select
                value={form.app_type}
                onChange={(v) =>
                  setForm({ ...form, app_type: v as Prayer["app_type"] })
                }
                options={[
                  { value: "both", label: "Both Apps" },
                  { value: "adult", label: "Adult App" },
                  { value: "kids", label: "Kids App" },
                ]}
              />
            </Field>
            <Field label="Publish date">
              <input
                type="date"
                className={inputClass}
                value={form.publish_date}
                onChange={(e) =>
                  setForm({ ...form, publish_date: e.target.value })
                }
              />
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(v) =>
                  setForm({ ...form, status: v as Prayer["status"] })
                }
                options={[
                  { value: "draft", label: "Draft" },
                  { value: "published", label: "Published" },
                  { value: "archived", label: "Archived" },
                ]}
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMut.mutate()}
              disabled={!form.title || !form.prayer_text}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title="Preview"
        wide
      >
        {preview && (
          <div className="space-y-4">
            <div>
              <p className="font-manrope text-xs font-semibold uppercase tracking-wide text-text-light">
                Standard version
              </p>
              <h3 className="mt-1 font-urbanist text-lg font-bold text-text-primary">
                {preview.title}
              </h3>
              <p className="mt-2 font-playfair text-base italic leading-relaxed text-text-body">
                {preview.prayer_text}
              </p>
            </div>
            {preview.kid_friendly_text && (
              <div className="rounded-card bg-purple-50 p-4">
                <p className="font-manrope text-xs font-semibold uppercase tracking-wide text-purple-600">
                  🧒 Kid-friendly version
                </p>
                <p className="mt-2 font-playfair text-base italic leading-relaxed text-purple-800">
                  {preview.kid_friendly_text}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Shell>
  );
}
