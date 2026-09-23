import type { ScriptureEntry, Devotional, BibleStory, Prayer } from "@/types";
import { mockScripture, mockDevotionals, mockBibleStories, mockPrayers } from "@/lib/mock/content";
import { delay } from "./users";

export type ContentStatus = ScriptureEntry["status"];

function now(): string {
  return new Date().toISOString();
}

// ---- Scripture ----

export interface ScriptureListParams {
  search?: string;
  app_type?: ScriptureEntry["app_type"];
  status?: ContentStatus;
  theme?: string;
}

export function getScripture(params: ScriptureListParams = {}): Promise<ScriptureEntry[]> {
  const { search, app_type, status, theme } = params;
  return delay(
    mockScripture
      .filter((s) => {
        if (search && !`${s.reference} ${s.verse_text}`.toLowerCase().includes(search.toLowerCase())) return false;
        if (app_type && s.app_type !== app_type) return false;
        if (status && s.status !== status) return false;
        if (theme && s.theme !== theme) return false;
        return true;
      })
      .sort((a, b) => a.publish_date.localeCompare(b.publish_date))
  );
}

export function createScripture(
  data: Omit<ScriptureEntry, "id" | "created_at" | "updated_at">
): Promise<ScriptureEntry> {
  const entry: ScriptureEntry = {
    ...data,
    id: `scr_${Date.now()}`,
    created_at: now(),
    updated_at: now(),
  };
  mockScripture.push(entry);
  return delay(entry);
}

export function updateScripture(
  id: string,
  data: Partial<ScriptureEntry>
): Promise<ScriptureEntry | undefined> {
  const i = mockScripture.findIndex((s) => s.id === id);
  if (i === -1) return delay(undefined);
  mockScripture[i] = { ...mockScripture[i], ...data, updated_at: now() };
  return delay(mockScripture[i]);
}

export function deleteScripture(id: string): Promise<{ ok: boolean }> {
  const i = mockScripture.findIndex((s) => s.id === id);
  if (i !== -1) mockScripture.splice(i, 1);
  return delay({ ok: i !== -1 });
}

/** CSV bulk import — parse happens in the UI, rows are inserted here. */
export function bulkImportScripture(
  rows: Array<Omit<ScriptureEntry, "id" | "created_at" | "updated_at">>
): Promise<{ imported: number }> {
  for (const r of rows) {
    mockScripture.push({
      ...r,
      id: `scr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      created_at: now(),
      updated_at: now(),
    });
  }
  return delay({ imported: rows.length });
}

// ---- Devotionals (adult-only) ----

export function getDevotionals(): Promise<Devotional[]> {
  return delay([...mockDevotionals].sort((a, b) => b.publish_date.localeCompare(a.publish_date)));
}

export function createDevotional(
  data: Omit<Devotional, "id" | "created_at" | "updated_at" | "app_type">
): Promise<Devotional> {
  const entry: Devotional = {
    ...data,
    app_type: "adult",
    id: `dev_${Date.now()}`,
    created_at: now(),
    updated_at: now(),
  };
  mockDevotionals.push(entry);
  return delay(entry);
}

export function updateDevotional(
  id: string,
  data: Partial<Devotional>
): Promise<Devotional | undefined> {
  const i = mockDevotionals.findIndex((d) => d.id === id);
  if (i === -1) return delay(undefined);
  mockDevotionals[i] = { ...mockDevotionals[i], ...data, updated_at: now() };
  return delay(mockDevotionals[i]);
}

export function deleteDevotional(id: string): Promise<{ ok: boolean }> {
  const i = mockDevotionals.findIndex((d) => d.id === id);
  if (i !== -1) mockDevotionals.splice(i, 1);
  return delay({ ok: i !== -1 });
}

// ---- Bible Stories (kids-only) ----

export function getBibleStories(): Promise<BibleStory[]> {
  return delay([...mockBibleStories].sort((a, b) => b.publish_date.localeCompare(a.publish_date)));
}

export function createBibleStory(
  data: Omit<BibleStory, "id" | "created_at" | "updated_at" | "app_type">
): Promise<BibleStory> {
  const entry: BibleStory = {
    ...data,
    app_type: "kids",
    id: `bst_${Date.now()}`,
    created_at: now(),
    updated_at: now(),
  };
  mockBibleStories.push(entry);
  return delay(entry);
}

export function updateBibleStory(
  id: string,
  data: Partial<BibleStory>
): Promise<BibleStory | undefined> {
  const i = mockBibleStories.findIndex((b) => b.id === id);
  if (i === -1) return delay(undefined);
  mockBibleStories[i] = { ...mockBibleStories[i], ...data, updated_at: now() };
  return delay(mockBibleStories[i]);
}

export function deleteBibleStory(id: string): Promise<{ ok: boolean }> {
  const i = mockBibleStories.findIndex((b) => b.id === id);
  if (i !== -1) mockBibleStories.splice(i, 1);
  return delay({ ok: i !== -1 });
}

// ---- Prayers (shared) ----

export function getPrayers(): Promise<Prayer[]> {
  return delay([...mockPrayers].sort((a, b) => b.publish_date.localeCompare(a.publish_date)));
}

export function createPrayer(
  data: Omit<Prayer, "id" | "created_at" | "updated_at">
): Promise<Prayer> {
  const entry: Prayer = {
    ...data,
    id: `pry_${Date.now()}`,
    created_at: now(),
    updated_at: now(),
  };
  mockPrayers.push(entry);
  return delay(entry);
}

export function updatePrayer(
  id: string,
  data: Partial<Prayer>
): Promise<Prayer | undefined> {
  const i = mockPrayers.findIndex((p) => p.id === id);
  return delay(
    i === -1 ? undefined : (mockPrayers[i] = { ...mockPrayers[i], ...data, updated_at: now() })
  );
}

export function deletePrayer(id: string): Promise<{ ok: boolean }> {
  const i = mockPrayers.findIndex((p) => p.id === id);
  if (i !== -1) mockPrayers.splice(i, 1);
  return delay({ ok: i !== -1 });
}
