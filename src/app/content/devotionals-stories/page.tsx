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
  Pagination,
} from "@/components/ui";
import {
  getDevotionals,
  createDevotional,
  updateDevotional,
  deleteDevotional,
  getBibleStories,
  createBibleStory,
  updateBibleStory,
  deleteBibleStory,
} from "@/lib/api";
import {
  contentStatusLabel,
  contentStatusTone,
  formatDate,
} from "@/lib/labels";
import type { Devotional, BibleStory } from "@/types";

const PAGE_SIZE = 6;
type Tab = "devotionals" | "stories";

export default function DevotionalsStoriesPage() {
  const [tab, setTab] = useState<Tab>("devotionals");
  const [page, setPage] = useState(1);

  const dev = useQuery({ queryKey: ["devotionals"], queryFn: getDevotionals });
  const stories = useQuery({
    queryKey: ["stories"],
    queryFn: getBibleStories,
  });

  const isLoading = tab === "devotionals" ? dev.isLoading : stories.isLoading;
  const devRows = (dev.data ?? []) as Devotional[];
  const storyRows = (stories.data ?? []) as BibleStory[];
  const pageCount = Math.max(
    1,
    Math.ceil(
      (tab === "devotionals" ? devRows.length : storyRows.length) / PAGE_SIZE
    )
  );

  return (
    <Shell>
      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        <TabButton
          active={tab === "devotionals"}
          onClick={() => {
            setTab("devotionals");
            setPage(1);
          }}
          label="🕯️ Devotionals"
          sub="Adult App only"
        />
        <TabButton
          active={tab === "stories"}
          onClick={() => {
            setTab("stories");
            setPage(1);
          }}
          label="🧒 Bible Stories"
          sub="Kids App only"
        />
      </div>

      {tab === "devotionals" ? (
        <DevotionalsTab
          rows={devRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
          isLoading={isLoading}
          onChanged={() => {
            dev.refetch();
            setPage(1);
          }}
        />
      ) : (
        <StoriesTab
          rows={storyRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
          isLoading={isLoading}
          onChanged={() => {
            stories.refetch();
            setPage(1);
          }}
        />
      )}

      <div className="mt-2">
        <Card>
          <Pagination page={page} pageCount={pageCount} onPage={setPage} />
        </Card>
      </div>
    </Shell>
  );
}

function TabButton({
  active,
  onClick,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-card px-5 py-3 shadow-card transition ${
        active ? "bg-primary-gradient text-white" : "bg-surface-card text-text-primary"
      }`}
    >
      <span className="font-urbanist text-sm font-semibold">{label}</span>
      <span
        className={`rounded-pill px-2 py-0.5 font-manrope text-xs ${
          active ? "bg-white/15 text-accent-blue" : "bg-surface-bg text-text-muted"
        }`}
      >
        {sub}
      </span>
    </button>
  );
}

// ================= Devotionals =================

function DevotionalsTab({
  rows,
  isLoading,
  onChanged,
}: {
  rows: Devotional[];
  isLoading: boolean;
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Devotional | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    scripture_reference: "",
    reflection: "",
    author: "",
    tags: "",
    publish_date: new Date().toISOString().slice(0, 10),
    status: "draft" as Devotional["status"],
  });
  const [preview, setPreview] = useState<Devotional | null>(null);

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        scripture_reference: form.scripture_reference,
        reflection: form.reflection,
        author: form.author,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        publish_date: form.publish_date,
        status: form.status,
      };
      if (editing) return updateDevotional(editing.id, payload);
      return createDevotional(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["devotionals"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      setFormOpen(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteDevotional(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["devotionals"] }),
  });

  const setStatus = (id: string, status: Devotional["status"]) =>
    updateDevotional(id, { status }).then(() => {
      qc.invalidateQueries({ queryKey: ["devotionals"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    });

  const openEdit = (d: Devotional) => {
    setEditing(d);
    setForm({
      title: d.title,
      scripture_reference: d.scripture_reference,
      reflection: d.reflection,
      author: d.author,
      tags: d.tags.join(", "),
      publish_date: d.publish_date,
      status: d.status,
    });
    setFormOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <Spinner />
      </Card>
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setForm({
              title: "",
              scripture_reference: "",
              reflection: "",
              author: "",
              tags: "",
              publish_date: new Date().toISOString().slice(0, 10),
              status: "draft",
            });
            setFormOpen(true);
          }}
        >
          ＋ Add Devotional
        </Button>
      </div>

      {rows.length === 0 ? (
        <Card>
          <EmptyState message="No devotionals yet." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((d) => (
            <Card key={d.id} className="flex flex-col">
              <div className="flex items-center justify-between">
                <Badge tone="bg-primary/10 text-primary">Adult App</Badge>
                <Badge tone={contentStatusTone[d.status]}>
                  {contentStatusLabel[d.status]}
                </Badge>
              </div>
              <h3 className="mt-3 font-urbanist text-base font-bold text-text-primary">
                {d.title}
              </h3>
              <p className="mt-1 font-playfair text-sm italic text-text-muted">
                {d.scripture_reference}
              </p>
              <p className="mt-2 line-clamp-3 flex-1 font-manrope text-xs leading-relaxed text-text-body">
                {d.reflection}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {d.tags.map((t) => (
                  <Badge key={t} tone="bg-surface-bg text-text-muted">
                    #{t}
                  </Badge>
                ))}
              </div>
              <p className="mt-2 font-manrope text-xs text-text-light">
                ✍ {d.author} · 📅 {formatDate(d.publish_date)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-text-faint/10 pt-3">
                <Button variant="secondary" onClick={() => setPreview(d)}>
                  Preview
                </Button>
                <Button variant="ghost" onClick={() => openEdit(d)}>
                  Edit
                </Button>
                {d.status === "published" ? (
                  <Button variant="ghost" onClick={() => setStatus(d.id, "archived")}>
                    Archive
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={() => setStatus(d.id, "published")}>
                    Publish
                  </Button>
                )}
                <Button
                  variant="danger"
                  className="ml-auto"
                  onClick={() => deleteMut.mutate(d.id)}
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
        title={editing ? "Edit Devotional" : "Add Devotional"}
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Scripture reference">
              <input
                className={inputClass}
                value={form.scripture_reference}
                onChange={(e) =>
                  setForm({ ...form, scripture_reference: e.target.value })
                }
              />
            </Field>
            <Field label="Author">
              <input
                className={inputClass}
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Reflection text">
            <textarea
              className={`${inputClass} min-h-[120px]`}
              value={form.reflection}
              onChange={(e) => setForm({ ...form, reflection: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tags (comma-separated)">
              <input
                className={inputClass}
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
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
          </div>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(v) =>
                setForm({ ...form, status: v as Devotional["status"] })
              }
              options={[
                { value: "draft", label: "Draft" },
                { value: "published", label: "Published" },
                { value: "archived", label: "Archived" },
              ]}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMut.mutate()}
              disabled={!form.title || !form.reflection}
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
          <div>
            <h3 className="font-urbanist text-xl font-bold text-text-primary">
              {preview.title}
            </h3>
            <p className="mt-2 font-playfair text-base italic text-primary">
              “{preview.scripture_reference}”
            </p>
            <p className="mt-4 whitespace-pre-wrap font-manrope text-sm leading-relaxed text-text-body">
              {preview.reflection}
            </p>
            <p className="mt-4 font-manrope text-xs text-text-light">
              ✍ {preview.author}
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}

// ================= Bible Stories =================

function StoriesTab({
  rows,
  isLoading,
  onChanged,
}: {
  rows: BibleStory[];
  isLoading: boolean;
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<BibleStory | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    age_range: "4-6",
    story_text: "",
    illustration_url: "",
    audio_narration_url: "",
    moral_tag: "",
    publish_date: new Date().toISOString().slice(0, 10),
    status: "draft" as BibleStory["status"],
  });
  const [preview, setPreview] = useState<BibleStory | null>(null);

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        age_range: form.age_range,
        story_text: form.story_text,
        illustration_url: form.illustration_url || undefined,
        audio_narration_url: form.audio_narration_url || undefined,
        moral_tag: form.moral_tag,
        publish_date: form.publish_date,
        status: form.status,
      };
      if (editing) return updateBibleStory(editing.id, payload);
      return createBibleStory(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stories"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      setFormOpen(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteBibleStory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stories"] }),
  });

  const openEdit = (b: BibleStory) => {
    setEditing(b);
    setForm({
      title: b.title,
      age_range: b.age_range,
      story_text: b.story_text,
      illustration_url: b.illustration_url ?? "",
      audio_narration_url: b.audio_narration_url ?? "",
      moral_tag: b.moral_tag,
      publish_date: b.publish_date,
      status: b.status,
    });
    setFormOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <Spinner />
      </Card>
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setForm({
              title: "",
              age_range: "4-6",
              story_text: "",
              illustration_url: "",
              audio_narration_url: "",
              moral_tag: "",
              publish_date: new Date().toISOString().slice(0, 10),
              status: "draft",
            });
            setFormOpen(true);
          }}
        >
          ＋ Add Bible Story
        </Button>
      </div>

      {rows.length === 0 ? (
        <Card>
          <EmptyState message="No bible stories yet." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((b) => (
            <Card key={b.id} className="flex flex-col overflow-hidden !p-0">
              {b.illustration_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={b.illustration_url}
                  alt={b.title}
                  className="h-36 w-full object-cover"
                />
              ) : (
                <div className="flex h-36 w-full items-center justify-center bg-primary-gradient text-4xl">
                  🖼️
                </div>
              )}
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center justify-between">
                  <Badge tone="bg-purple-100 text-purple-700">Kids App</Badge>
                  <Badge tone={contentStatusTone[b.status]}>
                    {contentStatusLabel[b.status]}
                  </Badge>
                </div>
                <h3 className="mt-3 font-urbanist text-base font-bold text-text-primary">
                  {b.title}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 font-manrope text-xs text-text-muted">
                  <Badge tone="bg-surface-bg text-text-muted">
                    Ages {b.age_range}
                  </Badge>
                  <Badge tone="bg-amber-50 text-amber-700">
                    {b.moral_tag}
                  </Badge>
                  {b.audio_narration_url && (
                    <Badge tone="bg-primary/10 text-primary">🔊 Audio</Badge>
                  )}
                </div>
                <p className="mt-2 line-clamp-3 flex-1 font-manrope text-xs leading-relaxed text-text-body">
                  {b.story_text}
                </p>
                <p className="mt-2 font-manrope text-xs text-text-light">
                  📅 {formatDate(b.publish_date)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-text-faint/10 pt-3">
                  <Button variant="secondary" onClick={() => setPreview(b)}>
                    Preview
                  </Button>
                  <Button variant="ghost" onClick={() => openEdit(b)}>
                    Edit
                  </Button>
                  {b.status === "published" ? (
                    <Button
                      variant="ghost"
                      onClick={() =>
                        updateBibleStory(b.id, { status: "archived" }).then(
                          onChanged
                        )
                      }
                    >
                      Archive
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() =>
                        updateBibleStory(b.id, { status: "published" }).then(
                          onChanged
                        )
                      }
                    >
                      Publish
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    className="ml-auto"
                    onClick={() => deleteMut.mutate(b.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Bible Story" : "Add Bible Story"}
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Age range">
              <Select
                value={form.age_range}
                onChange={(v) => setForm({ ...form, age_range: v })}
                options={[
                  { value: "4-6", label: "Ages 4-6" },
                  { value: "7-9", label: "Ages 7-9" },
                  { value: "10-12", label: "Ages 10-12" },
                ]}
              />
            </Field>
            <Field label="Moral / lesson tag">
              <input
                className={inputClass}
                value={form.moral_tag}
                placeholder="Courage, Forgiveness…"
                onChange={(e) =>
                  setForm({ ...form, moral_tag: e.target.value })
                }
              />
            </Field>
          </div>
          <Field label="Story text (simplified language)">
            <textarea
              className={`${inputClass} min-h-[120px]`}
              value={form.story_text}
              onChange={(e) => setForm({ ...form, story_text: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Illustration" hint="Upload placeholder — real upload arrives with the API.">
              <input
                className={inputClass}
                placeholder="https://…"
                value={form.illustration_url}
                onChange={(e) =>
                  setForm({ ...form, illustration_url: e.target.value })
                }
              />
            </Field>
            <Field label="Audio narration (optional)">
              <input
                className={inputClass}
                placeholder="https://…"
                value={form.audio_narration_url}
                onChange={(e) =>
                  setForm({ ...form, audio_narration_url: e.target.value })
                }
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
                  setForm({ ...form, status: v as BibleStory["status"] })
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
              disabled={!form.title || !form.story_text}
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
          <div>
            {preview.illustration_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.illustration_url}
                alt={preview.title}
                className="mb-4 h-44 w-full rounded-card object-cover"
              />
            )}
            <h3 className="font-urbanist text-xl font-bold text-text-primary">
              {preview.title}
            </h3>
            <p className="mt-1 font-manrope text-xs text-text-muted">
              Ages {preview.age_range} · Lesson: {preview.moral_tag}
            </p>
            <p className="mt-4 whitespace-pre-wrap font-manrope text-sm leading-relaxed text-text-body">
              {preview.story_text}
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
