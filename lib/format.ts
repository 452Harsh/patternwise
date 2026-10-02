import { daysBetween, today } from "./progress";

/** "today", "yesterday", "3d ago", "in 4d", or a short date beyond a month. */
export function relativeDay(dateOrIso: string | undefined): string {
  if (!dateOrIso) return "—";
  const day = dateOrIso.length > 10 ? new Date(dateOrIso).toLocaleDateString("en-CA") : dateOrIso;
  const d = daysBetween(today(), day);
  if (d === 0) return "today";
  if (d === -1) return "yesterday";
  if (d === 1) return "tomorrow";
  if (Math.abs(d) > 30) return shortDate(day);
  return d < 0 ? `${-d}d ago` : `in ${d}d`;
}

export function shortDate(day: string): string {
  return new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return relativeDay(iso);
}

export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function duration(sec: number | undefined): string {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}
