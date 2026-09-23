/**
 * Shared TypeScript interfaces — these mirror the JSON shape a real backend
 * would return. When the API swap happens, only /lib/api internals change.
 */

export type AppType = "adult" | "kids" | "both";

export type UserStatus = "active" | "suspended" | "banned";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  app_type: AppType;
  status: UserStatus;
  age_group: "child" | "teen" | "adult";
  parent_id?: string; // linked guardian, kids accounts only
  email_verified: boolean;
  streak_days: number;
  joined_groups: string[]; // group ids
  signup_date: string; // ISO datetime
  last_active: string; // ISO datetime
  avatar_url?: string;
}

export interface ScriptureEntry {
  id: string;
  reference: string; // "John 3:16"
  verse_text: string;
  translation: string; // "NIV" | "KJV" | ...
  theme: string; // tag e.g. "hope"
  app_type: AppType;
  publish_date: string; // scheduled date (ISO)
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
}

export interface Devotional {
  id: string;
  title: string;
  scripture_reference: string;
  reflection: string;
  author: string;
  tags: string[];
  app_type: Extract<AppType, "adult">; // adult-only
  publish_date: string;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
}

export interface BibleStory {
  id: string;
  title: string;
  age_range: string; // "4-6" | "7-9" | "10-12"
  story_text: string;
  illustration_url?: string;
  audio_narration_url?: string;
  moral_tag: string;
  app_type: Extract<AppType, "kids">; // kids-only
  publish_date: string;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
}

export interface Prayer {
  id: string;
  title: string;
  prayer_text: string;
  kid_friendly_text?: string; // optional simplified variant
  category: PrayerCategory;
  app_type: AppType;
  publish_date: string;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
}

export type PrayerCategory =
  | "morning"
  | "evening"
  | "gratitude"
  | "healing"
  | "guidance"
  | "protection";

export type PostStatus = "pending" | "approved" | "hidden" | "deleted" | "flagged";

export interface CommunityPost {
  id: string;
  author_id: string;
  author_name: string;
  group_id?: string;
  group_name?: string;
  content: string;
  app_type: AppType; // kids posts are moderated/kid-safe
  status: PostStatus;
  flagged_reason?: string;
  report_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
}

export interface FaithGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  member_count: number;
  is_adult_only: boolean;
  is_kid_safe: boolean;
  activity_score: number; // 0-100
  created_at: string;
}

export type ReportStatus = "open" | "resolved" | "dismissed";

export interface ReportedItem {
  id: string;
  post_id: string;
  post_excerpt: string;
  reporter_name: string;
  reason: string;
  status: ReportStatus;
  app_type: AppType;
  created_at: string;
}

export type PrayerRequestStatus = "open" | "answered" | "archived" | "hidden";

export interface PrayerRequest {
  id: string;
  author_id: string;
  author_name: string;
  request_text: string;
  app_type: AppType;
  status: PrayerRequestStatus;
  is_flagged: boolean;
  flagged_reason?: string;
  is_featured: boolean;
  like_count: number;
  support_count: number;
  commenters: string[]; // names
  created_at: string;
}

export type NotificationAudience = "adult" | "kids" | "both" | "segment" | "group";

export type NotificationType =
  | "daily_scripture"
  | "prayer_reminder"
  | "challenge"
  | "community"
  | "general";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  audience: NotificationAudience;
  audience_label?: string; // segment/group name when targeted
  notification_type: NotificationType;
  scheduled_at: string; // ISO datetime
  is_recurring: boolean;
  recurrence?: "daily" | "weekly";
  status: "sent" | "scheduled" | "failed";
  sent_count: number;
  open_count: number;
  created_at: string;
}

// ---- Dashboard aggregates ----

export interface DashboardStats {
  total_users: number;
  adult_users: number;
  kids_users: number;
  active_streaks: number;
  pending_moderation: number;
  prayer_requests_today: number;
  scheduled_content_week: number;
  notifications_sent_30d: number;
  avg_open_rate: number;
}

export interface WeeklyActivityPoint {
  label: string;
  users: number;
  prayer_requests: number;
}

// ---- Auth ----

export type Role = "super_admin" | "content_editor" | "moderator" | "support_admin";
