import type { AppType } from "@/types";

export const appTypeLabel: Record<AppType, string> = {
  adult: "Adult App",
  kids: "Kids App",
  both: "Both Apps",
};

export const appTypeBadgeTone: Record<AppType, string> = {
  adult: "bg-primary/10 text-primary",
  kids: "bg-purple-100 text-purple-700",
  both: "bg-accent-blue/50 text-text-primary",
};

export const contentStatusLabel: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
  pending: "Pending",
  approved: "Approved",
  hidden: "Hidden",
  deleted: "Deleted",
  flagged: "Flagged",
};

export const contentStatusTone: Record<string, string> = {
  draft: "bg-text-faint/20 text-text-muted",
  published: "bg-emerald-100 text-emerald-700",
  archived: "bg-text-light/20 text-text-muted",
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  hidden: "bg-red-100 text-red-600",
  deleted: "bg-red-100 text-red-600",
  flagged: "bg-red-100 text-red-600",
};

export const userStatusLabel: Record<string, string> = {
  active: "Active",
  suspended: "Suspended",
  banned: "Banned",
};

export const userStatusTone: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  suspended: "bg-amber-100 text-amber-700",
  banned: "bg-red-100 text-red-600",
};

export const prayerCategoryLabel: Record<string, string> = {
  morning: "Morning",
  evening: "Evening",
  gratitude: "Gratitude",
  healing: "Healing",
  guidance: "Guidance",
  protection: "Protection",
};

export const notificationTypeLabel: Record<string, string> = {
  daily_scripture: "Daily Scripture Reminder",
  prayer_reminder: "Prayer Reminder",
  challenge: "Challenge",
  community: "Community",
  general: "General",
};

export const notificationAudienceLabel: Record<string, string> = {
  adult: "Adult App",
  kids: "Kids App",
  both: "Both Apps",
  segment: "User Segment",
  group: "Group",
};

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}
