"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Shell } from "@/components/Shell";
import { Card, StatCard, Badge, Spinner } from "@/components/ui";
import {
  getDashboardStats,
  getWeeklyActivity,
  getScripture,
  getPrayerRequests,
} from "@/lib/api";
import { appTypeLabel, appTypeBadgeTone, formatDate, relativeTime } from "@/lib/labels";

export default function DashboardPage() {
  const stats = useQuery({ queryKey: ["stats"], queryFn: getDashboardStats });
  const activity = useQuery({
    queryKey: ["weekly-activity"],
    queryFn: getWeeklyActivity,
  });
  const scripture = useQuery({
    queryKey: ["scripture", "upcoming"],
    queryFn: () => getScripture(),
  });
  const prayerRequests = useQuery({
    queryKey: ["prayer-requests", "recent"],
    queryFn: () => getPrayerRequests(),
  });

  if (stats.isLoading || activity.isLoading) {
    return (
      <Shell>
        <Spinner label="Loading dashboard…" />
      </Shell>
    );
  }

  const s = stats.data;
  const upcoming =
    scripture.data
      ?.filter((x) => x.publish_date >= new Date().toISOString().slice(0, 10))
      .slice(0, 5) ?? [];
  const flagged =
    prayerRequests.data?.filter((r) => r.is_flagged).slice(0, 4) ?? [];

  return (
    <Shell>
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Users"
          value={s?.total_users ?? "—"}
          sub={`${s?.adult_users ?? 0} adult · ${s?.kids_users ?? 0} kids`}
          icon="👥"
        />
        <StatCard
          label="Active Streaks (7d+)"
          value={s?.active_streaks ?? "—"}
          sub="Users engaged this week"
          icon="🔥"
        />
        <StatCard
          label="Pending Moderation"
          value={s?.pending_moderation ?? "—"}
          sub="Posts & prayer requests"
          icon="⚖️"
        />
        <StatCard
          accent
          label="Prayer Requests Today"
          value={s?.prayer_requests_today ?? "—"}
          sub="On the Prayer Wall"
          icon="🙏"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Activity chart */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-urbanist text-lg font-semibold">
                Weekly Activity
              </h2>
              <p className="font-manrope text-xs text-text-muted">
                Active users vs. new prayer requests, last 7 days
              </p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity.data ?? []}>
                <defs>
                  <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#25596E" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#25596E" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gPrayers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#BBCCD2" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#BBCCD2" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E7E9" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#686868" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#686868" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "none",
                    boxShadow: "0 8px 24px rgba(2,5,7,.12)",
                    fontFamily: "Manrope, sans-serif",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  name="Active users"
                  stroke="#25596E"
                  strokeWidth={2}
                  fill="url(#gUsers)"
                />
                <Area
                  type="monotone"
                  dataKey="prayer_requests"
                  name="Prayer requests"
                  stroke="#7FA3AE"
                  strokeWidth={2}
                  fill="url(#gPrayers)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Secondary stats + flagged queue */}
        <div className="space-y-4">
          <Card>
            <h2 className="font-urbanist text-base font-semibold">
              Content & Delivery
            </h2>
            <div className="mt-4 space-y-3">
              <Row
                label="Scheduled scripture (7 days)"
                value={String(s?.scheduled_content_week ?? 0)}
              />
              <Row
                label="Notifications sent (30d)"
                value={String(s?.notifications_sent_30d ?? 0)}
              />
              <Row
                label="Avg. open rate"
                value={`${s?.avg_open_rate ?? 0}%`}
              />
            </div>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-urbanist text-base font-semibold">
                Flagged Requests
              </h2>
              <Badge tone="bg-red-100 text-red-600">
                {prayerRequests.data?.filter((r) => r.is_flagged).length ?? 0}
              </Badge>
            </div>
            {flagged.length === 0 ? (
              <p className="font-manrope text-sm text-text-muted">
                Nothing flagged. 🎉
              </p>
            ) : (
              <ul className="space-y-3">
                {flagged.map((r) => (
                  <li key={r.id} className="rounded-card bg-surface-bg p-3">
                    <p className="line-clamp-2 font-manrope text-xs text-text-body">
                      “{r.request_text}”
                    </p>
                    <p className="mt-1 font-manrope text-xs text-text-light">
                      {r.author_name} · {relativeTime(r.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Upcoming scripture */}
      <Card className="mt-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-urbanist text-lg font-semibold">
            Scheduled Scripture — Next Up
          </h2>
          <Badge tone="bg-primary/10 text-primary">
            {s?.scheduled_content_week ?? 0} this week
          </Badge>
        </div>
        {upcoming.length === 0 ? (
          <p className="font-manrope text-sm text-text-muted">
            Nothing scheduled ahead — the calendar is empty.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {upcoming.map((x) => (
              <li
                key={x.id}
                className="rounded-card border border-text-faint/20 p-4"
              >
                <div className="flex items-center justify-between">
                  <Badge tone={appTypeBadgeTone[x.app_type]}>
                    {appTypeLabel[x.app_type]}
                  </Badge>
                  <span className="font-manrope text-xs text-text-muted">
                    {formatDate(x.publish_date)}
                  </span>
                </div>
                <p className="mt-2 font-playfair text-sm italic text-text-primary">
                  “{x.verse_text.slice(0, 110)}
                  {x.verse_text.length > 110 ? "…" : ""}”
                </p>
                <p className="mt-2 font-manrope text-xs font-semibold text-text-muted">
                  {x.reference} · {x.translation}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Shell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-manrope text-sm text-text-muted">{label}</span>
      <span className="font-urbanist text-sm font-bold text-text-primary">
        {value}
      </span>
    </div>
  );
}
