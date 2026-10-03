# UI architecture & design system

## Stack

- **Tailwind CSS v4**. All configuration lives in CSS, in `app/globals.css`: `@theme inline`, `@custom-variant dark`, tokens defined as CSS variables, and `tw-animate-css`. There is no `tailwind.config` file.
- **shadcn/ui 4, "base-nova" style, built on Base UI** (`@base-ui/react`). The generated primitives live in `components/ui/` and are configured in `components.json`. Base UI composes with a **`render` prop, not `asChild`**.
- **Libraries:**
  - `lucide-react` for icons
  - `sonner` for toasts
  - `cmdk` for the command palette
  - `recharts` 3 through `components/ui/chart.tsx`
  - `prism-react-renderer` for code (`components/code-block.tsx`; a Java grammar is registered manually)
- **Theme:** `next-themes` (`components/shell/providers.tsx`) defaults to dark with `enableSystem={false}`. The theme toggle is in the sidebar and in Settings.
- **Fonts:** Geist and Geist Mono. Mono is used for numbers, counters and eyebrow labels.

## Tokens

Use semantic tokens, never raw colours:
- **Base:** `background`, `foreground`, `card`, `popover`, `muted`, `border`, `input`, `ring`, `sidebar-*`
- **Accent:** `primary`, `secondary`, `accent`
- **Status:** `success`, `warning`, `info`, `destructive`
- **Extra:** `surface` (a subtle inset background, used for cells inside panels)

Radii come from `--radius`. Animations: `animate-page` (the page fade used by `app/(app)/template.tsx`), `animate-pop` and `animate-grow-x`.

Conventions:
- **Tones:** `success` = mastered or done, `primary` = in progress, `warning` = due or needs attention, `destructive` = failed or forgotten.
- **Mastery colour:** comes from `masteryTone(v)` in `components/kit.tsx`.

## Shared kit: reuse before creating

| Component | File | Use for |
|---|---|---|
| `Panel` | `components/kit.tsx` | Every card-like surface |
| `PageHeader` | kit | The top of every page (`eyebrow`, `title`, `subtitle`, `actions`) |
| `SectionTitle` | kit | Section headings inside a page |
| `Meter`, `Ring`, `pct`, `masteryTone` | kit | Progress bars, rings and percentages |
| `DifficultyBadge`, `StatusBadge` (`STATUS_META`), `Tag`, `Confidence`, `Kbd` | kit | Small labels |
| `EmptyState`, `Shimmer` | kit | Empty and loading states (**every page shows `Shimmer` until `useHydrated()`**) |
| `Metric` | `components/metric.tsx` | Stat tiles |
| `UrlTabs` | `components/url-tabs.tsx` | Tabs stored in `?tab=` |
| `NativeSelect` | `components/native-select.tsx` | Filters and simple selects |
| Charts (`InView`, `SolvedOverTime`, `TopicBars`, `DifficultyDonut`, `PatternHeatmap`, `ActivityCalendar`) | `components/charts.tsx` | Analytics (rendered lazily with `InView`) |
| `ActivityFeed scope` | `components/activity-feed.tsx` | Recent activity for one module |
| `DailyPlan tracks` | `components/daily-plan.tsx` | Today's tasks for one module |
| `NotesView scope` | `components/notes-view.tsx` | The notes pages |
| `CodeBlock` | `components/code-block.tsx` | Syntax-highlighted code |
| SD kit (`SDProgressPanel`, `CompleteButton`, `ReviewButtons`, `SDNotes`, `StarToggle`, `SDStatusBadge`, `TrackTag`, `SDItemList`) | `components/sd/sd-kit.tsx` | Any SD item page |
| Workspace kit (`WSection`, `StringList`, `RowsEditor`, `PromptField`, `Hints`, `rid`) | `components/sd/workspace-kit.tsx` | HLD/LLD workspace sections |
| `FlowDiagram`, `UMLDiagram` | `components/sd/flow-diagram.tsx`, `uml-diagram.tsx` | Visual explanations |

## Shell (`components/shell/`)

- **`nav.ts`:** `MODULES` (one entry per module, holding its groups and mobile `tabs`), `SHARED_NAV`, `moduleForPath`, `isSharedRoute`, `navItems`, `isActive`. `isActive` understands query-filtered entries such as `/progress?tab=analytics`.
- **`module.ts`:** `useModule()` returns the active module, `moduleEntry(id)` returns the last page visited in that module, and the localStorage keys `pw:module`, `pw:last:dsa` and `pw:last:sd` are kept here.
- **`module-switcher.tsx`:** the DSA | System Design control. It comes in a `full` variant (in the sidebar) and a `compact` variant (on mobile).
- **`app-sidebar.tsx`:** a collapsible sidebar with module groups and revision badges (`useRevisionBadges`).
- **Other shell files:**
  - `mobile-nav.tsx`: the top bar plus a bottom tab bar (`MODULES[m].tabs`)
  - `command-menu.tsx`: the ⌘K palette, scoped to the active module, plus the `G`-key shortcuts and the `?` help
  - `sync-boot.tsx`: `SyncBoot` starts the sync; `SyncIndicator` shows its state
  - `theme-toggle.tsx`

## Patterns used throughout

- **Client pages** read the store with hooks and render `Shimmer` until hydrated. Don't fetch inside components; all data comes from `lib/progress.ts`.
- **URL state:** filters and tabs that should survive a reload or be linkable use search params (`?tab=`, `?add=1`, `?track=`, `?mode=`, `?item=`). Pages using `useSearchParams` wrap their content in `<Suspense>`.
- **Layout:**
  - Pages are a vertical stack (`space-y-6` / `space-y-8`) of `Panel`s.
  - Grids are `grid-cols-1` on mobile and widen at `md` / `lg` / `xl`. Add `min-w-0` on grid children to prevent overflow.
  - Side-by-side cards should have matching structure and `h-full`; the Settings page's `SettingsCard` is a good example.
- **Container queries:** use these when a component can appear both full-page and embedded (the architecture editor uses `@container` / `@5xl:`).
- **Accessibility:**
  - Icon-only buttons get an `aria-label` or `title`.
  - Decorative icons get `aria-hidden`.
  - Custom tab lists use `role="tablist"` / `role="tab"` / `aria-selected`.
  - Radio-like toggles use `role="radio"` / `aria-checked`.
  - Focus is visible with `focus-visible:ring-2 focus-visible:ring-ring`.
- **Feedback:** call `toast` (sonner) after user actions with lasting effects. Use an `AlertDialog` for destructive or replacing actions (import, reset, delete).
- **Copy:**
  - The product is "DSA preparation" (not "FAANG preparation").
  - SD status labels are Not started / Learning / Completed / Mastered.
  - Keep labels short and sentence case.

## Responsive behaviour

- **≥ `lg`:** the sidebar is visible and collapsible (`settings.sidebarCollapsed`).
- **Below `lg`:** a top bar with a module switcher, plus a bottom tab bar with four tabs per module.
- **Tables and lists:** stack into cards on small screens; there's no horizontal page scroll.
