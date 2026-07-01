import {
  CalendarClock, ListChecks, Trophy, Wallet, ShieldAlert, Target,
  BarChart3, Users,
  Table2,
} from "lucide-react";
import type { ComponentType } from "react";

/**
 * All shared calculation / formatting logic for the tender dashboard lives
 * here. Add new metrics, date bucketing rules, or nav entries in this file —
 * the tab components and page just call these, they don't own any logic.
 */

/* ---------------------------- date helpers ---------------------------- */

export const parseDate = (s: string | null): Date | null => (s ? new Date(s) : null);

export const yearOf = (s: string | null): number | null => {
  const x = parseDate(s);
  return x ? x.getFullYear() : null;
};

export const quarterOf = (s: string | null): number | null => {
  const x = parseDate(s);
  return x ? Math.floor(x.getMonth() / 3) + 1 : null;
};

export const halfOf = (s: string | null): "H1" | "H2" | null => {
  const q = quarterOf(s);
  return q ? (q <= 2 ? "H1" : "H2") : null;
};

export const monthOf = (s: string | null): string | null => {
  const x = parseDate(s);
  return x ? `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}` : null;
};

export const monthsBetween = (a: Date, b: Date): number =>
  (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + (b.getDate() >= a.getDate() ? 0 : -1);

/* ---------------------------- formatting ---------------------------- */

export const fmtMYR = (n: number | null | undefined): string =>
  n == null ? "—" : `RM ${Number(n).toLocaleString("en-MY", { maximumFractionDigits: 0 })}`;

/** Parses the "-9.90%" string produced by PercentageJsonConverter back to a number. */
export const varianceNum = (v: string | null): number | null =>
  v == null ? null : parseFloat(v.replace("%", ""));

/* ---------------------------- array helpers ---------------------------- */

export const uniqStr = (arr: (string | null)[]): string[] =>
  Array.from(new Set(arr.filter((v): v is string => !!v))).sort();

export const uniqNum = (arr: (number | null)[]): number[] =>
  Array.from(new Set(arr.filter((v): v is number => v != null))).sort((a, b) => a - b);

/* ---------------------------- status colors ---------------------------- */

export const STATUS_COLORS: Record<string, string> = {
  Win: "#1E8E6E",
  Lose: "#C4453A",
  Pending: "#C88A15",
  "Not Participate": "#6B7280",
};

export const statusColor = (status: string | null): string =>
  STATUS_COLORS[status ?? "Not Participate"] ?? "#6B7280";

export const ACCENT = "#0E5C56";

/** Palette used for multi-series charts (brand contribution, etc). Add more hexes if you add more brands. */
export const SERIES_PALETTE = ["#0E5C56", "#5FCBB8", "#C88A15", "#8B5CF6", "#C4453A", "#2563EB"];

/* ---------------------------- nav config ---------------------------- */

export interface NavItem {
  key: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  href?: string;
}

/**
 * Sidebar tabs. To add a new dashboard: add an entry here, add a case in
 * page.tsx's tab switch, and add the tab component to
 * src/components/dashboard/tabs.tsx.
 */
export const NAV: NavItem[] = [
  { key: "forecast", label: "Tender Forecast", icon: CalendarClock },
  { key: "status", label: "Tender Status", icon: ListChecks },
  { key: "winlose", label: "Win / Lose Performance", icon: Trophy },
  { key: "value", label: "Awarded Value", icon: Wallet },
  { key: "expiry", label: "Contract Expiry", icon: ShieldAlert },
  { key: "opportunity", label: "Opportunities", icon: Target },
  { key: "brand", label: "Brand Contribution", icon: BarChart3 },
  { key: "salesperson", label: "Sales Performance", icon: Users },
  { key: "table", label: "Table", icon: Table2, href: "/masterdatabase/table" },
];