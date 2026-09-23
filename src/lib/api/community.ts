import type { CommunityPost, FaithGroup, ReportedItem } from "@/types";
import { mockCommunityPosts, mockGroups, mockReportedItems } from "@/lib/mock/community";
import { delay } from "./users";

// ---- Community posts ----

export interface PostListParams {
  search?: string;
  app_type?: CommunityPost["app_type"];
  status?: CommunityPost["status"];
  group_id?: string;
}

export function getCommunityPosts(params: PostListParams = {}): Promise<CommunityPost[]> {
  const { search, app_type, status, group_id } = params;
  return delay(
    mockCommunityPosts
      .filter((p) => {
        if (search && !p.content.toLowerCase().includes(search.toLowerCase())) return false;
        if (app_type && p.app_type !== app_type) return false;
        if (status && p.status !== status) return false;
        if (group_id && p.group_id !== group_id) return false;
        return true;
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  );
}

export function moderatePost(
  postId: string,
  action: "approve" | "hide" | "delete"
): Promise<{ ok: boolean }> {
  const p = mockCommunityPosts.find((x) => x.id === postId);
  if (p) {
    if (action === "delete") {
      mockCommunityPosts.splice(mockCommunityPosts.indexOf(p), 1);
    } else {
      p.status = action === "approve" ? "approved" : "hidden";
    }
  }
  return delay({ ok: !!p });
}

export function warnAuthor(postId: string): Promise<{ ok: boolean }> {
  // Real backend would send a warning notice to the author.
  return delay({ ok: mockCommunityPosts.some((p) => p.id === postId) });
}

// ---- Faith groups ----

export function getGroups(): Promise<FaithGroup[]> {
  return delay([...mockGroups].sort((a, b) => b.member_count - a.member_count));
}

export function createGroup(
  data: Omit<FaithGroup, "id" | "created_at" | "member_count" | "activity_score">
): Promise<FaithGroup> {
  const group: FaithGroup = {
    ...data,
    id: `grp_${Date.now()}`,
    member_count: 0,
    activity_score: 0,
    created_at: new Date().toISOString(),
  };
  mockGroups.push(group);
  return delay(group);
}

export function updateGroup(
  id: string,
  data: Partial<FaithGroup>
): Promise<FaithGroup | undefined> {
  const i = mockGroups.findIndex((g) => g.id === id);
  if (i === -1) return delay(undefined);
  mockGroups[i] = { ...mockGroups[i], ...data };
  return delay(mockGroups[i]);
}

export function deleteGroup(id: string): Promise<{ ok: boolean }> {
  const i = mockGroups.findIndex((g) => g.id === id);
  if (i !== -1) mockGroups.splice(i, 1);
  return delay({ ok: i !== -1 });
}

// ---- Reported content queue ----

export function getReportedItems(): Promise<ReportedItem[]> {
  return delay(
    [...mockReportedItems].sort((a, b) => {
      const rank = (s: ReportedItem["status"]) => (s === "open" ? 0 : 1);
      return rank(a.status) - rank(b.status) || b.created_at.localeCompare(a.created_at);
    })
  );
}

export function resolveReport(id: string): Promise<{ ok: boolean }> {
  const r = mockReportedItems.find((x) => x.id === id);
  if (r) r.status = "resolved";
  return delay({ ok: !!r });
}

export function dismissReport(id: string): Promise<{ ok: boolean }> {
  const r = mockReportedItems.find((x) => x.id === id);
  if (r) r.status = "dismissed";
  return delay({ ok: !!r });
}
