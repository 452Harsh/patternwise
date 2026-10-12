/**
 * Activity and streaks. Kept free of curriculum imports: the sidebar uses `streaks` on every page,
 * and importing `lib/stats` there would put the whole DSA question bank in the shared bundle.
 */
import { addDays, today, type State } from "./progress";

export type Scope = "dsa" | "sd";

/** Days with activity: DSA attempts + DSA mock interviews, or System Design reviews/practice/sessions. */
export function activityByDay(state: State, scope: Scope = "dsa"): Map<string, number> {
  const counts = new Map<string, number>();
  const bump = (d: string) => counts.set(d, (counts.get(d) ?? 0) + 1);
  if (scope === "dsa") {
    for (const e of Object.values(state.problems)) for (const h of e.history) bump(h.date);
    for (const m of state.mocks) bump(m.date);
  } else {
    for (const e of Object.values(state.sd)) for (const h of e.history) bump(h.date);
  }
  return counts;
}

export function streaks(state: State, scope: Scope = "dsa") {
  const days = activityByDay(state, scope);
  const t = today();
  let current = 0;
  // A streak survives until the end of today even if today has no activity yet.
  let d = days.has(t) ? t : addDays(t, -1);
  while (days.has(d)) {
    current++;
    d = addDays(d, -1);
  }
  const sorted = [...days.keys()].sort();
  let longest = 0;
  let run = 0;
  let prev = "";
  for (const day of sorted) {
    run = prev && addDays(prev, 1) === day ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = day;
  }
  return { current, longest, activeToday: days.has(t) };
}

