/** Helpers to keep mock data dates relative to "now" so the demo always looks fresh. */

export function daysAgo(n: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, (n * 13) % 60, 0, 0);
  return d.toISOString();
}

export function daysFromNow(n: number, hour = 9): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, (n * 17) % 60, 0, 0);
  return d.toISOString();
}

/** ISO date (yyyy-mm-dd) offset by n days from today — for schedule/calendar fields. */
export function dateOffset(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
