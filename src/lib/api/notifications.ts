import type {
  AppNotification,
  DashboardStats,
  WeeklyActivityPoint,
} from "@/types";
import { mockNotifications } from "@/lib/mock/notifications";
import { mockUsers } from "@/lib/mock/users";
import { mockScripture } from "@/lib/mock/content";
import { mockCommunityPosts, mockPrayerRequests } from "@/lib/mock/community";
import { delay } from "./users";

export interface NotificationListParams {
  status?: AppNotification["status"];
  type?: AppNotification["notification_type"];
}

export function getNotifications(
  params: NotificationListParams = {}
): Promise<AppNotification[]> {
  const { status, type } = params;
  return delay(
    mockNotifications
      .filter((n) => {
        if (status && n.status !== status) return false;
        if (type && n.notification_type !== type) return false;
        return true;
      })
      .sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at))
  );
}

export function createNotification(
  data: Omit<
    AppNotification,
    "id" | "status" | "sent_count" | "open_count" | "created_at"
  > & { send_now?: boolean }
): Promise<AppNotification> {
  const notification: AppNotification = {
    ...data,
    id: `ntf_${Date.now()}`,
    status: data.send_now ? "sent" : "scheduled",
    sent_count: data.send_now ? Math.floor(2000 + Math.random() * 9000) : 0,
    open_count: data.send_now ? Math.floor(600 + Math.random() * 2000) : 0,
    created_at: new Date().toISOString(),
  };
  mockNotifications.push(notification);
  return delay(notification);
}

export function cancelNotification(id: string): Promise<{ ok: boolean }> {
  const i = mockNotifications.findIndex((n) => n.id === id);
  if (i !== -1) mockNotifications.splice(i, 1);
  return delay({ ok: i !== -1 });
}

// ---- Dashboard aggregates ----

export function getDashboardStats(): Promise<DashboardStats> {
  const adults = mockUsers.filter((u) => u.app_type === "adult").length;
  const kids = mockUsers.filter((u) => u.app_type === "kids").length;
  const pending = mockCommunityPosts.filter(
    (p) => p.status === "pending" || p.status === "flagged"
  ).length;
  const flaggedRequests = mockPrayerRequests.filter((r) => r.is_flagged).length;
  const today = new Date().toISOString().slice(0, 10);
  const prayerToday = mockPrayerRequests.filter(
    (r) => r.created_at.slice(0, 10) === today
  ).length;
  const in7 = new Date();
  in7.setDate(in7.getDate() + 7);
  const in7s = in7.toISOString().slice(0, 10);
  const scheduledWeek = mockScripture.filter(
    (s) =>
      s.status !== "archived" &&
      s.publish_date >= today &&
      s.publish_date <= in7s
  ).length;

  const sent = mockNotifications.filter((n) => n.status === "sent");
  const sentTotal = sent.reduce((a, n) => a + n.sent_count, 0);
  const openTotal = sent.reduce((a, n) => a + n.open_count, 0);

  return delay({
    total_users: mockUsers.length,
    adult_users: adults,
    kids_users: kids,
    active_streaks: mockUsers.filter((u) => u.streak_days >= 7).length,
    pending_moderation: pending + flaggedRequests,
    prayer_requests_today: prayerToday,
    scheduled_content_week: scheduledWeek,
    notifications_sent_30d: sentTotal,
    avg_open_rate: sentTotal > 0 ? Math.round((openTotal / sentTotal) * 100) : 0,
  });
}

export function getWeeklyActivity(): Promise<WeeklyActivityPoint[]> {
  // Derive plausible per-day numbers from live mock aggregates.
  const points: WeeklyActivityPoint[] = [];
  const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const baseUsers = mockUsers.filter((u) => u.status === "active").length;
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    points.push({
      label: names[(d.getDay() + 6) % 7],
      users: Math.round(baseUsers * (0.55 + 0.09 * ((d.getDay() + 3) % 5))),
      prayer_requests: 4 + ((d.getDay() * 3) % 9),
    });
  }
  return delay(points);
}
