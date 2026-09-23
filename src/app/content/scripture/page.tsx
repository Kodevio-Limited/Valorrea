"use client";

import { useMemo, useRef, useState } from "react";
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
  getScripture,
  createScripture,
  updateScripture,
  deleteScripture,
  bulkImportScripture,
} from "@/lib/api";
import { parseCSV } from "@/lib/csv";
import {
  appTypeLabel,
  appTypeBadgeTone,
  contentStatusLabel,
  contentStatusTone,
  formatDate,
} from "@/lib/labels";
import type { ScriptureEntry } from "@/types";

const PAGE_SIZE = 8;

interface FormState {
  reference: string;
  verse_text: string;
  translation: string;
  theme: string;
  app_type: ScriptureEntry["app_type"];
  publish_date: string;
  status: ScriptureEntry["status"];
}

const emptyForm: FormState = {
  reference: "",
  verse_text: "",
  translation: "NIV",
  theme: "",
  app_type: "both",
  publish_date: new Date().toISOString().slice(0, 10),
  status: "draft",
};

export default function ScripturePage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [appType, setAppType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ScriptureEntry | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [importOpen, setImportOpen] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["scripture", { search, appType, status }],
    queryFn: () =>
      getScripture({
        search: search || undefined,
        app_type: (appType || undefined) as ScriptureEntry["app_type"] | undefined,
        status: (status || undefined) as ScriptureEntry["status"] | undefined,
      }),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["scripture"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      if (editing) {
        return updateScripture(editing.id, form);
      }
      return createScripture(form);
    },
    onSuccess: () => {
      invalidate();
      setFormOpen(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteScripture(id),
    onSuccess: invalidate,
  });

  const importMut = useMutation({
    mutationFn: (text: string) => {
      const rows = parseCSV(text)
        .filter((r) => r.reference && r.verse_text)
        .map((r) => ({
          reference: r.reference,
          verse_text: r.verse_text,
          translation: r.translation || "NIV",
          theme: r.theme || "general",
          app_type: (["adult", "kids", "both"].includes(r.app_type)
            ? r.app_type
            : "both") as ScriptureEntry["app_type"],
          publish_date:
            r.publish_date || new Date().toISOString().slice(0, 10),
          status: (["draft", "published", "archived"].includes(r.status)
            ? r.status
            : "draft") as ScriptureEntry["status"],
        }));
      return bulkImportScripture(rows);
    },
    onSuccess: (res) => {
      invalidate();
      setImportResult(`Imported ${res.imported} verse(s).`);
    },
  });

  const filtered = data ?? [];
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };
  const openEdit = (s: ScriptureEntry) => {
    setEditing(s);
    setForm({
      reference: s.reference,
      verse_text: s.verse_text,
      translation: s.translation,
      theme: s.theme,
      app_type: s.app_type,
      publish_date: s.publish_date,
      status: s.status,
    });
    setFormOpen(true);
  };

  return (
    <Shell>
      {/* Toolbar */}
      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <input
            className={inputClass}
            placeholder="Search reference or text…"
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
              { value: "both", label: "Both Apps" },
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
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
              { value: "archived", label: "Archived" },
            ]}
          />
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            ⬆ Bulk import (CSV)
          </Button>
          <Button onClick={openCreate}>＋ Add Scripture</Button>
        </div>
      </Card>

      {isLoading ? (
        <Card>
          <Spinner />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pageRows.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-3">
              <Card>
                <EmptyState message="No scripture entries match these filters." />
              </Card>
            </div>
          ) : (
            pageRows.map((s) => (
              <Card key={s.id} className="flex flex-col">
                <div className="flex items-center justify-between">
                  <Badge tone={appTypeBadgeTone[s.app_type]}>
                    {appTypeLabel[s.app_type]}
                  </Badge>
                  <Badge tone={contentStatusTone[s.status]}>
                    {contentStatusLabel[s.status]}
                  </Badge>
                </div>
                <p className="mt-3 flex-1 font-playfair text-base italic leading-relaxed text-text-primary">
                  “{s.verse_text.length > 150 ? s.verse_text.slice(0, 150) + "…" : s.verse_text}”
                </p>
                <p className="mt-3 font-urbanist text-sm font-bold text-primary">
                  {s.reference}
                </p>
                <div className="mt-1 flex items-center justify-between font-manrope text-xs text-text-muted">
                  <span>
                    {s.translation} · #{s.theme}
                  </span>
                  <span>📅 {formatDate(s.publish_date)}</span>
                </div>
                <div className="mt-4 flex gap-2 border-t border-text-faint/10 pt-3">
                  <Button variant="secondary" onClick={() => openEdit(s)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      updateScripture(s.id, {
                        status:
                          s.status === "published" ? "archived" : "published",
                      }).then(invalidate)
                    }
                  >
                    {s.status === "published" ? "Archive" : "Publish"}
                  </Button>
                  <Button
                    variant="danger"
                    className="ml-auto"
                    onClick={() => deleteMut.mutate(s.id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      <div className="mt-2">
        <Card>
          <Pagination page={page} pageCount={pageCount} onPage={setPage} />
        </Card>
      </div>

      {/* Create/Edit modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Scripture" : "Add Scripture"}
        wide
      >
        <div className="space-y-4">
          <Field label="Reference">
            <input
              className={inputClass}
              value={form.reference}
              placeholder="John 3:16"
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
            />
          </Field>
          <Field label="Verse text">
            <textarea
              className={`${inputClass} min-h-[100px]`}
              value={form.verse_text}
              onChange={(e) =>
                setForm({ ...form, verse_text: e.target.value })
              }
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Translation">
              <input
                className={inputClass}
                value={form.translation}
                onChange={(e) =>
                  setForm({ ...form, translation: e.target.value })
                }
              />
            </Field>
            <Field label="Theme / tag">
              <input
                className={inputClass}
                value={form.theme}
                placeholder="hope, courage…"
                onChange={(e) => setForm({ ...form, theme: e.target.value })}
              />
            </Field>
            <Field label="App type">
              <Select
                value={form.app_type}
                onChange={(v) =>
                  setForm({ ...form, app_type: v as FormState["app_type"] })
                }
                options={[
                  { value: "both", label: "Both Apps" },
                  { value: "adult", label: "Adult App" },
                  { value: "kids", label: "Kids App" },
                ]}
              />
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(v) =>
                  setForm({ ...form, status: v as FormState["status"] })
                }
                options={[
                  { value: "draft", label: "Draft" },
                  { value: "published", label: "Published" },
                  { value: "archived", label: "Archived" },
                ]}
              />
            </Field>
          </div>
          <Field label="Publish (schedule) date">
            <input
              type="date"
              className={inputClass}
              value={form.publish_date}
              onChange={(e) =>
                setForm({ ...form, publish_date: e.target.value })
              }
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMut.mutate()}
              disabled={!form.reference || !form.verse_text}
            >
              {editing ? "Save changes" : "Add Scripture"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import modal */}
      <Modal
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          setImportResult(null);
        }}
        title="Bulk import scripture (CSV)"
      >
        <p className="mb-3 font-manrope text-sm text-text-muted">
          Columns: <code>reference, verse_text, translation, theme, app_type,
          publish_date, status</code>. Rows missing reference or verse_text are
          skipped.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="mb-3 block w-full font-manrope text-sm"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            file.text().then((t) => importMut.mutate(t));
          }}
        />
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) file.text().then((t) => importMut.mutate(t));
          }}
          className="rounded-card border-2 border-dashed border-text-faint/40 p-6 text-center font-manrope text-sm text-text-light"
        >
          …or drag & drop a .csv file here
        </div>
        {importResult && (
          <p className="mt-3 rounded-card bg-emerald-50 px-4 py-2 font-manrope text-sm text-emerald-700">
            ✅ {importResult}
          </p>
        )}
      </Modal>
    </Shell>
  );
}
