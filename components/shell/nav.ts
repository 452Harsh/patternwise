import {
  BarChart3,
  BookOpen,
  Briefcase,
  CalendarRange,
  LayoutDashboard,
  Library,
  ListChecks,
  NotebookPen,
  RotateCcw,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Second key of a "g then x" shortcut. */
  key: string;
}

export const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, key: "d" },
  { href: "/problems", label: "Problems", icon: ListChecks, key: "p" },
  { href: "/topics", label: "Topics", icon: BookOpen, key: "t" },
  { href: "/patterns", label: "Patterns", icon: Library, key: "l" },
  { href: "/study-plan", label: "Study Plan", icon: CalendarRange, key: "s" },
  { href: "/revision", label: "Revision", icon: RotateCcw, key: "r" },
  { href: "/progress", label: "Progress", icon: BarChart3, key: "a" },
  { href: "/notes", label: "Notes", icon: NotebookPen, key: "n" },
  { href: "/interview", label: "Interview Prep", icon: Briefcase, key: "i" },
  { href: "/settings", label: "Settings", icon: Settings, key: "," },
];

export const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
