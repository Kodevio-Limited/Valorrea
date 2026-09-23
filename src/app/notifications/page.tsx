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
} from "@/components/ui";
import {
  getNotifications,
  createNotification,
  cancelNotification,
} from "@/lib/api";
import {
  notificationTypeLabel,
  notificationAudienceLabel,
  formatDateTime,
} from "@/lib/labels";
import type { AppNotification, NotificationAudience, NotificationType } from "@/types";

export default function NotificationsPage() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", filterStatus],
    queryFn: () =>
      getNotifications({
        status: (filterStatus || undefined) as AppNotification["status"] | undefined,
      }),
  });

  const cancelMut = useMutation({
    mutationFn: (id: string) => cancelNotification(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  return (
    <Shell>
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            placeholder="All notifications"
            className="sm:max-w-xs"
            options={[
              { value: "sent", label: "Sent" },
              { value: "scheduled", label: "Scheduled" },
              { value: "failed", label: "Failed" },
            ]}
          />
          <span className="font-manrope text-xs text-text-light">
            {data?.length ?? 0} notification(s)
          </span>
          <div className="ml-auto">
            <Button onClick={() => setComposeOpen(true)}>
              ＋ Compose Notification
            </Button>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <Card>
          <Spinner />
        </Card>
      ) : (data ?? []).length === 0 ? (
        <Card>
          <EmptyState icon="🔔" message="No notifications yet." />
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-text-faint/20">
                <Th>Notification</Th>
                <Th>Audience</Th>
                <Th>Type</Th>
                <Th>Schedule</Th>
                <Th>Delivery</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((n) => (
                <tr
                  key={n.id}
                  className="border-b border-text-faint/10 align-top transition hover:bg-surface-bg/60"
                >
                  <td className="max-w-xs py-4 pr-4">
                    <p className="font-urbanist text-sm font-semibold text-text-primary">
                      {n.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 font-manrope text-xs text-text-muted">
                      {n.message}
                    </p>
                  </td>
                  <td className="py-4 pr-4">
                    <Badge tone="bg-primary/10 text-primary">
                      {notificationAudienceLabel[n.audience]}
                    </Badge>
                    {n.audience_label && (
                      <p className="mt-1 font-manrope text-xs text-text-light">
                        {n.audience_label}
                      </p>
                    )}
                  </td>
                  <td className="py-4 pr-4 font-manrope text-xs text-text-body">
                    {notificationTypeLabel[n.notification_type]}
                  </td>
                  <td className="py-4 pr-4">
                    <p className="font-manrope text-xs text-text-body">
                      {formatDateTime(n.scheduled_at)}
                    </p>
                    {n.is_recurring && (
                      <Badge tone="bg-purple-100 text-purple-700">
                        ↻ {n.recurrence}
                      </Badge>
                    )}
                  </td>
                  <td className="py-4 pr-4">
                    <Badge
                      tone={
                        n.status === "sent"
                          ? "bg-emerald-100 text-emerald-700"
                          : n.status === "scheduled"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-600"
                      }
                      className="capitalize"
                    >
                      {n.status}
                    </Badge>
                    {n.status === "sent" && (
                      <p className="mt-1 font-manrope text-xs text-text-light">
                        {n.sent_count.toLocaleString()} sent ·{" "}
                        {n.sent_count > 0
                          ? Math.round((n.open_count / n.sent_count) * 100)
                          : 0}
                        % opens
                      </p>
                    )}
                  </td>
                  <td className="py-4">
                    {n.status === "scheduled" && (
                      <Button
                        variant="danger"
                        onClick={() => cancelMut.mutate(n.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <ComposeModal open={composeOpen} onClose={() => setComposeOpen(false)} />
    </Shell>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="pb-3 font-manrope text-xs font-semibold uppercase tracking-wide text-text-muted">
      {children}
    </th>
  );
}

function ComposeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    message: "",
    audience: "both" as NotificationAudience,
    audience_label: "",
    notification_type: "daily_scripture" as NotificationType,
    date: new Date().toISOString().slice(0, 10),
    time: "09:00",
    send_now: false,
    is_recurring: false,
    recurrence: "daily" as "daily" | "weekly",
  });

  const send = useMutation({
    mutationFn: () =>
      createNotification({
        title: form.title,
        message: form.message,
        audience: form.audience,
        audience_label: form.audience_label || undefined,
        notification_type: form.notification_type,
        scheduled_at: new Date(`${form.date}T${form.time}:00`).toISOString(),
        is_recurring: form.is_recurring,
        recurrence: form.is_recurring ? form.recurrence : undefined,
        send_now: form.send_now,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      onClose();
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Compose Push Notification" wide>
      <div className="space-y-4">
        <Field label="Title">
          <input
            className={inputClass}
            value={form.title}
            placeholder="Your verse for today is ready"
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </Field>
        <Field label="Message">
          <textarea
            className={`${inputClass} min-h-[80px]`}
            value={form.message}
            placeholder="Start your morning with today's Daily Scripture…"
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Target audience">
            <Select
              value={form.audience}
              onChange={(v) =>
                setForm({ ...form, audience: v as NotificationAudience })
              }
              options={[
                { value: "both", label: "Both Apps" },
                { value: "adult", label: "Adult App" },
                { value: "kids", label: "Kids App" },
                { value: "segment", label: "Specific user segment" },
                { value: "group", label: "Specific group" },
              ]}
            />
          </Field>
          {(form.audience === "segment" || form.audience === "group") && (
            <Field
              label={form.audience === "segment" ? "Segment name" : "Group name"}
            >
              <input
                className={inputClass}
                value={form.audience_label}
                placeholder={
                  form.audience === "segment"
                    ? "e.g. Active last 7 days"
                    : "e.g. Prayer Warriors"
                }
                onChange={(e) =>
                  setForm({ ...form, audience_label: e.target.value })
                }
              />
            </Field>
          )}
          <Field label="Notification type">
            <Select
              value={form.notification_type}
              onChange={(v) =>
                setForm({
                  ...form,
                  notification_type: v as NotificationType,
                })
              }
              options={[
                { value: "daily_scripture", label: "Daily Scripture reminder" },
                { value: "prayer_reminder", label: "Prayer reminder" },
                { value: "challenge", label: "Challenge" },
                { value: "community", label: "Community activity" },
                { value: "general", label: "General" },
              ]}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Send date">
            <input
              type="date"
              className={inputClass}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Field>
          <Field label="Send time">
            <input
              type="time"
              className={inputClass}
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            />
          </Field>
        </div>

        <div className="rounded-card bg-surface-bg p-4">
          <label className="flex items-center gap-2 font-manrope text-sm font-semibold text-text-body">
            <input
              type="checkbox"
              checked={form.is_recurring}
              onChange={(e) =>
                setForm({ ...form, is_recurring: e.target.checked })
              }
              className="h-4 w-4 accent-[#25596E]"
            />
            Recurring notification
          </label>
          {form.is_recurring && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Repeats">
                <Select
                  value={form.recurrence}
                  onChange={(v) =>
                    setForm({ ...form, recurrence: v as "daily" | "weekly" })
                  }
                  options={[
                    { value: "daily", label: "Every day" },
                    { value: "weekly", label: "Every week" },
                  ]}
                />
              </Field>
              <p className="self-end font-manrope text-xs text-text-light">
                Sent at the scheduled time in each user's timezone /
                notification preference.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 font-manrope text-sm text-text-body">
            <input
              type="checkbox"
              checked={form.send_now}
              onChange={(e) => setForm({ ...form, send_now: e.target.checked })}
              className="h-4 w-4 accent-[#25596E]"
            />
            Send immediately
          </label>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => send.mutate()}
              disabled={!form.title || !form.message}
            >
              {form.send_now ? "🚀 Send now" : "🗓️ Schedule"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
