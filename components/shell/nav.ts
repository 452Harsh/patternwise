import {
  BarChart3,
  Blocks,
  BookOpen,
  Boxes,
  Briefcase,
  CalendarRange,
  Code2,
  Component,
  LayoutDashboard,
  Library,
  ListChecks,
  Network,
  NotebookPen,
  PieChart,
  RotateCcw,
  Settings,
  Shapes,
  Sparkles,
  Target,
  MessageCircleQuestion,
  SquareDashedKanban,
  Timer,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export type ModuleId = "dsa" | "sd" | "coach";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Second key of a "g then x" shortcut (scoped to the module). */
  key?: string;
  /** Only active on an exact path match (for dashboards). */
  exact?: boolean;
}

export interface NavGroup {
  id: string;
  label?: string;
  items: NavItem[];
}

export interface ModuleDef {
  id: ModuleId;
  label: string;
  short: string;
  description: string;
  icon: LucideIcon;
  home: string;
  groups: NavGroup[];
  /** Bottom tab bar on mobile. */
  tabs: NavItem[];
}

const DSA: ModuleDef = {
  id: "dsa",
  label: "DSA",
  short: "DSA",
  description: "Data structures & algorithms",
  icon: Code2,
  home: "/",
  groups: [
    {
      id: "learn",
      items: [
        { href: "/", label: "Dashboard", icon: LayoutDashboard, key: "d", exact: true },
        { href: "/problems", label: "Problems", icon: ListChecks, key: "p" },
        { href: "/topics", label: "Topics", icon: BookOpen, key: "t" },
        { href: "/patterns", label: "Patterns", icon: Library, key: "l" },
      ],
    },
    {
      id: "practise",
      label: "Practise",
      items: [
        { href: "/study-plan", label: "Study Plan", icon: CalendarRange, key: "s" },
        { href: "/revision", label: "Revision", icon: RotateCcw, key: "r" },
        { href: "/interview", label: "Interview Prep", icon: Briefcase, key: "i" },
      ],
    },
    {
      id: "track",
      label: "Track",
      items: [
        { href: "/progress", label: "Progress", icon: BarChart3, key: "a" },
        { href: "/progress?tab=analytics", label: "Analytics", icon: PieChart, key: "y" },
        { href: "/notes", label: "Notes", icon: NotebookPen, key: "n" },
      ],
    },
  ],
  tabs: [
    { href: "/", label: "Today", icon: LayoutDashboard, exact: true },
    { href: "/problems", label: "Problems", icon: ListChecks },
    { href: "/revision", label: "Revision", icon: RotateCcw },
    { href: "/progress", label: "Progress", icon: BarChart3 },
  ],
};

const SD: ModuleDef = {
  id: "sd",
  label: "System Design",
  short: "SD",
  description: "High- & low-level design",
  icon: Network,
  home: "/system-design",
  groups: [
    {
      id: "learn",
      items: [
        { href: "/system-design", label: "Dashboard", icon: LayoutDashboard, key: "d", exact: true },
        { href: "/system-design/hld", label: "HLD", icon: Network, key: "h" },
        { href: "/system-design/lld", label: "LLD", icon: Component, key: "k" },
        { href: "/system-design/concepts", label: "Concepts", icon: Blocks, key: "c" },
        { href: "/system-design/patterns", label: "Design Patterns", icon: Shapes, key: "l" },
        { href: "/system-design/problems", label: "Problems", icon: Boxes, key: "p" },
        { href: "/system-design/architecture", label: "Architecture", icon: Workflow, key: "x" },
        { href: "/system-design/uml", label: "UML / LLD Design", icon: SquareDashedKanban, key: "u" },
      ],
    },
    {
      id: "practise",
      label: "Practise",
      items: [
        { href: "/system-design/study-plan", label: "Study Plan", icon: CalendarRange, key: "s" },
        { href: "/system-design/revision", label: "Revision", icon: RotateCcw, key: "r" },
        { href: "/system-design/interview", label: "Interview Mode", icon: Timer, key: "i" },
      ],
    },
    {
      id: "track",
      label: "Track",
      items: [
        { href: "/system-design/progress", label: "Progress", icon: BarChart3, key: "a" },
        { href: "/system-design/progress?tab=analytics", label: "Analytics", icon: PieChart, key: "y" },
        { href: "/system-design/notes", label: "Notes", icon: NotebookPen, key: "n" },
      ],
    },
  ],
  tabs: [
    { href: "/system-design", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/system-design/problems", label: "Problems", icon: Boxes },
    { href: "/system-design/revision", label: "Revision", icon: RotateCcw },
    { href: "/system-design/progress", label: "Progress", icon: BarChart3 },
  ],
};

/** AI Coach: reads both modules' progress, but each coach page works in one module context at a time. */
const COACH: ModuleDef = {
  id: "coach",
  label: "AI Coach",
  short: "Coach",
  description: "Personal interview coach",
  icon: Sparkles,
  home: "/coach",
  groups: [
    {
      id: "coach",
      items: [
        { href: "/coach", label: "Today's Plan", icon: CalendarRange, key: "d", exact: true },
        { href: "/coach/ask", label: "Ask Coach", icon: MessageCircleQuestion, key: "a" },
        { href: "/coach/interview", label: "Interview Mode", icon: Timer, key: "i" },
        { href: "/coach/weak-areas", label: "My Weak Areas", icon: Target, key: "w" },
      ],
    },
  ],
  tabs: [
    { href: "/coach", label: "Today", icon: CalendarRange, exact: true },
    { href: "/coach/ask", label: "Ask", icon: MessageCircleQuestion },
    { href: "/coach/interview", label: "Interview", icon: Timer },
    { href: "/coach/weak-areas", label: "Weak areas", icon: Target },
  ],
};

export const MODULES: Record<ModuleId, ModuleDef> = { dsa: DSA, sd: SD, coach: COACH };
export const MODULE_LIST: ModuleDef[] = [DSA, SD, COACH];

/** Keyboard digit for "G <n>" module switching. */
export const moduleDigit = (m: ModuleId) => String(MODULE_LIST.findIndex((x) => x.id === m) + 1);

/** Shared across both modules. */
export const SHARED_NAV: NavItem[] = [{ href: "/settings", label: "Settings", icon: Settings, key: "," }];

/** Shared routes don't belong to a module; the shell keeps showing the last module. */
export const isSharedRoute = (pathname: string) => SHARED_NAV.some((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));

export const moduleForPath = (pathname: string): ModuleId =>
  pathname === "/system-design" || pathname.startsWith("/system-design/")
    ? "sd"
    : pathname === "/coach" || pathname.startsWith("/coach/")
      ? "coach"
      : "dsa";

export const navItems = (m: ModuleId): NavItem[] => [...MODULES[m].groups.flatMap((g) => g.items), ...SHARED_NAV];

const split = (href: string) => {
  const [path, query = ""] = href.split("?");
  return { path, params: new URLSearchParams(query) };
};

/**
 * Active state that understands query-filtered entries within one module:
 * "/progress?tab=analytics" is active only with that query, and then plain "/progress" is not.
 */
export function isActive(item: NavItem, pathname: string, search: string, siblings: NavItem[]): boolean {
  const { path, params } = split(item.href);
  const current = new URLSearchParams(search);
  const pathMatch = item.exact || path === "/" ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
  if (!pathMatch) return false;
  if ([...params].length) return [...params].every(([k, v]) => current.get(k) === v);
  return !siblings.some((other) => {
    if (other === item || !other.href.includes("?")) return false;
    const o = split(other.href);
    return o.path === path && [...o.params].every(([k, v]) => current.get(k) === v);
  });
}
