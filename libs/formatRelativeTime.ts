/**
 * Coarse "2 hours ago" phrasing. Deliberately imprecise — this is reassurance
 * that something saved, not a timestamp anyone reads closely.
 */
export function formatRelativeTime(from: Date, now: number): string {
  const seconds = Math.round((now - from.getTime()) / 1000);

  if (seconds < 45) return "just now";
  if (seconds < 90) return "about a minute ago";

  const minutes = Math.round(seconds / 60);
  if (minutes < 45) return `${minutes} minutes ago`;
  if (minutes < 90) return "about an hour ago";

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `about ${hours} hours ago`;

  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}
