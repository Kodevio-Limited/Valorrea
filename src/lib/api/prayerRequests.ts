import type { PrayerRequest } from "@/types";
import { mockPrayerRequests } from "@/lib/mock/community";
import { delay } from "./users";

export interface PrayerRequestListParams {
  search?: string;
  app_type?: PrayerRequest["app_type"];
  status?: PrayerRequest["status"];
  flagged?: "only" | "none";
}

export function getPrayerRequests(
  params: PrayerRequestListParams = {}
): Promise<PrayerRequest[]> {
  const { search, app_type, status, flagged } = params;
  return delay(
    mockPrayerRequests
      .filter((r) => {
        if (search && !r.request_text.toLowerCase().includes(search.toLowerCase()))
          return false;
        if (app_type && r.app_type !== app_type) return false;
        if (status && r.status !== status) return false;
        if (flagged === "only" && !r.is_flagged) return false;
        return true;
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  );
}

export function moderatePrayerRequest(
  id: string,
  action: "approve" | "hide" | "delete" | "mark_answered"
): Promise<{ ok: boolean }> {
  const r = mockPrayerRequests.find((x) => x.id === id);
  if (r) {
    if (action === "delete") {
      mockPrayerRequests.splice(mockPrayerRequests.indexOf(r), 1);
    } else if (action === "approve") {
      r.status = "open";
      r.is_flagged = false;
    } else if (action === "hide") {
      r.status = "hidden";
    } else {
      r.status = "answered";
    }
  }
  return delay({ ok: !!r });
}

export function toggleFeatureRequest(id: string, featured: boolean): Promise<{ ok: boolean }> {
  const r = mockPrayerRequests.find((x) => x.id === id);
  if (r) r.is_featured = featured;
  return delay({ ok: !!r });
}
