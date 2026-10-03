/** Calendar-day helpers (yyyy-mm-dd, local time). Pure: safe on the server and the client. */

export const today = () => new Date().toLocaleDateString("en-CA");

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA");
}

export function daysBetween(from: string, to: string): number {
  const ms = new Date(`${to}T12:00:00`).getTime() - new Date(`${from}T12:00:00`).getTime();
  return Math.round(ms / 86_400_000);
}

/** Days until the next review, by confidence (1–5). Grows with each successful revisit. */
const BASE_INTERVAL = [1, 1, 3, 7, 14, 30];
export const reviewInterval = (confidence: number, revisitCount: number) =>
  Math.max(1, Math.round(BASE_INTERVAL[confidence] * (1 + 0.5 * revisitCount)));
