"use client";

import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import type { DrawerState, ResultStatus, TenderRow } from "@/app/types/tender";
import {
  ACCENT, fmtMYR, halfOf, monthOf, monthsBetween, parseDate, quarterOf,
  statusColor, STATUS_COLORS, uniqNum, uniqStr, varianceNum, SERIES_PALETTE,
} from "@/app/lib/tenders/utils";
import { ClickKpi, Kpi, Panel, Segmented, BAR_STYLE } from "@/app/components/dashboard/ui";

/**
 * One tab component per dashboard requirement. Each owns only the
 * calculation logic specific to it (period bucketing, chart shaping) —
 * shared helpers live in lib/tenders/utils.ts, shared widgets in
 * components/dashboard/ui.tsx.
 *
 * TO ADD A NEW DASHBOARD:
 *   1. Write a new `function MyTab({ rows }: { rows: TenderRow[] }) {...}` here.
 *   2. Export it.
 *   3. Add a NAV entry in lib/tenders/utils.ts.
 *   4. Add a case for it in app/masterdatabase/page.tsx.
 */

const TODAY = new Date();

/* ---------------- Sidebar signature widget: live win-rate pulse ---------------- */
export function WinRatePulse({ rows }: { rows: TenderRow[] }) {
  const decided = rows.filter((r) => r.resultStatus === "Win" || r.resultStatus === "Lose");
  const wins = decided.filter((r) => r.resultStatus === "Win").length;
  const rate = decided.length ? Math.round((wins / decided.length) * 100) : 0;
  const r = 30, c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
      <svg width="68" height="68" viewBox="0 0 68 68">
        <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
        <circle
          cx="34" cy="34" r={r} fill="none" stroke="#5FCBB8" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * rate) / 100}
          transform="rotate(-90 34 34)"
        />
        <text x="34" y="38" textAnchor="middle" fontSize="15" fontWeight="700" fill="white">{rate}%</text>
      </svg>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8FB8AF]">Win Rate</div>
        <div className="text-[12px] text-[#C7D9D6]">{wins} win / {decided.length} decided</div>
      </div>
    </div>
  );
}

/* ================================ 1. Forecast ================================ */
export function ForecastTab({ base, openDrawer }: { base: TenderRow[]; openDrawer: (d: DrawerState) => void }) {
  const [period, setPeriod] = useState<"quarter" | "half">("quarter");
  const upcoming = base.filter((r) => r.expectedTenderOpenDate && (parseDate(r.expectedTenderOpenDate) as Date) >= TODAY);

  const keyOf = (r: TenderRow): string => period === "quarter"
    ? `${r.expectedTenderOpenDate ? new Date(r.expectedTenderOpenDate).getFullYear() : ""} Q${quarterOf(r.expectedTenderOpenDate)}`
    : `${r.expectedTenderOpenDate ? new Date(r.expectedTenderOpenDate).getFullYear() : ""} ${halfOf(r.expectedTenderOpenDate)}`;

  const buckets = useMemo(() => {
    const keys = Array.from(new Set(upcoming.map(keyOf))).sort((a, b) => a.localeCompare(b));
    return keys.map((key) => ({ key, count: upcoming.filter((r) => keyOf(r) === key).length }));
  }, [upcoming, period]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Kpi label="Upcoming Opportunities" value={upcoming.length} sub={`Expected to open after ${TODAY.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`} accent={ACCENT} />
        <Kpi label="Nearest Period" value={buckets[0]?.key ?? "—"} sub={buckets[0] ? `${buckets[0].count} tender(s)` : "No forecast data"} />
        <Kpi label="Total Estimated Budget" value={fmtMYR(upcoming.reduce((s, r) => s + (r.budget ?? 0), 0))} sub="Sum of listed budgets" />
      </div>

      <Panel title="Upcoming tenders by period" action={<Segmented value={period} onChange={setPeriod} options={[{ value: "quarter", label: "Quarter" }, { value: "half", label: "Half-Year" }]} />}>
        {buckets.length === 0 ? (
          <div className="rounded-md border border-dashed border-[#DEE3E2] py-10 text-center text-[13px] text-[#8B9895]">No upcoming tenders match the current filters.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {buckets.map((b) => (
              <ClickKpi
                key={b.key}
                label={b.key}
                value={b.count}
                sub="tenders"
                accent={ACCENT}
                onClick={() => openDrawer({ title: `Forecast — ${b.key}`, rows: upcoming.filter((r) => keyOf(r) === b.key) })}
              />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

/* ================================ 2. Status ================================ */
export function StatusTab({ rows, openDrawer }: { rows: TenderRow[]; openDrawer: (d: DrawerState) => void }) {
  const statuses: ResultStatus[] = ["Pending", "Win", "Lose", "Not Participate"];
  const counts = statuses.map((s) => ({ status: s, count: rows.filter((r) => (r.resultStatus ?? "Not Participate") === s).length }));
  const pieData = counts.filter((c) => c.count > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {counts.map((c) => (
          <ClickKpi
            key={c.status}
            label={c.status}
            value={c.count}
            accent={statusColor(c.status)}
            onClick={() => openDrawer({ title: `Status — ${c.status}`, rows: rows.filter((r) => (r.resultStatus ?? "Not Participate") === c.status) })}
          />
        ))}
      </div>
      <Panel title="Status distribution">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={pieData} dataKey="count" nameKey="status" innerRadius={65} outerRadius={100} paddingAngle={2}>
              {pieData.map((c) => <Cell key={c.status} fill={statusColor(c.status)} />)}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}

/* ================================ 3. Win / Lose ================================ */
type WinLosePeriod = "year" | "quarter" | "half";

export function WinLoseTab({ rows }: { rows: TenderRow[] }) {
  const [period, setPeriod] = useState<WinLosePeriod>("year");
  const decided = rows.filter((r) => r.resultStatus === "Win" || r.resultStatus === "Lose");

  const keyOf = (r: TenderRow): string => {
    const y = r.tenderOpenDate ? new Date(r.tenderOpenDate).getFullYear() : "—";
    return period === "year" ? String(y)
      : period === "quarter" ? `${y} Q${quarterOf(r.tenderOpenDate)}`
      : `${y} ${halfOf(r.tenderOpenDate)}`;
  };

  const data = useMemo(() => {
    const keys = Array.from(new Set(decided.map(keyOf))).sort((a, b) => a.localeCompare(b));
    return keys.map((k) => {
      const g = decided.filter((r) => keyOf(r) === k);
      const win = g.filter((r) => r.resultStatus === "Win").length;
      const lose = g.filter((r) => r.resultStatus === "Lose").length;
      return { key: k, Win: win, Lose: lose, winRate: g.length ? Math.round((win / g.length) * 100) : 0 };
    });
  }, [decided, period]);

  const totalWin = decided.filter((r) => r.resultStatus === "Win").length;
  const totalLose = decided.filter((r) => r.resultStatus === "Lose").length;
  const winRate = decided.length ? ((totalWin / decided.length) * 100).toFixed(1) : "0.0";
  const loseRate = decided.length ? ((totalLose / decided.length) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Kpi label="Total Win" value={totalWin} accent={STATUS_COLORS.Win} />
        <Kpi label="Total Lose" value={totalLose} accent={STATUS_COLORS.Lose} />
        <Kpi label="Win Rate" value={`${winRate}%`} accent={STATUS_COLORS.Win} />
        <Kpi label="Lose Rate" value={`${loseRate}%`} accent={STATUS_COLORS.Lose} />
      </div>
      <Panel title="Win vs Lose over time" action={<Segmented value={period} onChange={setPeriod} options={[{ value: "year", label: "Year" }, { value: "quarter", label: "Quarter" }, { value: "half", label: "Half-Year" }]} />}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} barGap={4}>
            <CartesianGrid vertical={false} stroke="#EEF1F0" />
            <XAxis dataKey="key" tick={BAR_STYLE} axisLine={{ stroke: "#E4E7E6" }} tickLine={false} />
            <YAxis tick={BAR_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Win" fill={STATUS_COLORS.Win} radius={[3, 3, 0, 0]} />
            <Bar dataKey="Lose" fill={STATUS_COLORS.Lose} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}

/* ================================ 4. Awarded Value ================================ */
type ValuePeriod = "month" | "quarter" | "half" | "year";

export function ValueTab({ rows }: { rows: TenderRow[] }) {
  const [period, setPeriod] = useState<ValuePeriod>("quarter");
  const [year, setYear] = useState<string>("");
  const wins = rows.filter((r) => r.resultStatus === "Win" && r.awardedAmount != null);
  const years = uniqNum(wins.map((r) => (r.tenderOpenDate ? new Date(r.tenderOpenDate).getFullYear() : null)));

  const keyOf = (r: TenderRow): string => {
    const y = r.tenderOpenDate ? new Date(r.tenderOpenDate).getFullYear() : "—";
    return period === "month" ? (monthOf(r.tenderOpenDate) ?? "—")
      : period === "quarter" ? `${y} Q${quarterOf(r.tenderOpenDate)}`
      : period === "half" ? `${y} ${halfOf(r.tenderOpenDate)}`
      : String(y);
  };

  const scopedRows = year ? wins.filter((r) => String(r.tenderOpenDate ? new Date(r.tenderOpenDate).getFullYear() : "") === year) : wins;

  const data = useMemo(() => {
    const keys = Array.from(new Set(scopedRows.map(keyOf))).sort((a, b) => a.localeCompare(b));
    return keys.map((k) => {
      const g = scopedRows.filter((r) => keyOf(r) === k);
      const variances = g.map((r) => varianceNum(r.awardedVariance)).filter((v): v is number => v != null);
      return {
        key: k,
        amount: g.reduce((s, r) => s + (r.awardedAmount ?? 0), 0),
        avgVariance: variances.length ? +(variances.reduce((s, v) => s + v, 0) / variances.length).toFixed(2) : null,
      };
    });
  }, [scopedRows, period]);

  const avgVarianceOverall = data.length
    ? (data.reduce((s, x) => s + (x.avgVariance ?? 0), 0) / data.length).toFixed(2)
    : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Kpi label="Total Awarded Value" value={fmtMYR(wins.reduce((s, r) => s + (r.awardedAmount ?? 0), 0))} accent={ACCENT} />
        <Kpi label="Won Tenders" value={wins.length} />
        <Kpi label="Avg. Variance" value={avgVarianceOverall != null ? `${avgVarianceOverall}%` : "—"} sub="vs. budget" />
      </div>
      <Panel
        title="Awarded amount by period"
        action={
          <div className="flex items-center gap-2">
            <select value={year} onChange={(e) => setYear(e.target.value)} className="rounded-md border border-[#DEE3E2] bg-white px-2 py-1 text-[12px]">
              <option value="">All years</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <Segmented value={period} onChange={setPeriod} options={[{ value: "month", label: "Month" }, { value: "quarter", label: "Quarter" }, { value: "half", label: "H1/H2" }, { value: "year", label: "Year" }]} />
          </div>
        }
      >
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid vertical={false} stroke="#EEF1F0" />
            <XAxis dataKey="key" tick={BAR_STYLE} axisLine={{ stroke: "#E4E7E6" }} tickLine={false} />
            <YAxis tick={BAR_STYLE} axisLine={false} tickLine={false} tickFormatter={(v: any) => `${(Number(v) / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: any) => fmtMYR(Number(v))} />
            <Bar dataKey="amount" name="Awarded Amount" fill={ACCENT} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title="Awarded variance trend (avg. vs budget)">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data}>
            <CartesianGrid vertical={false} stroke="#EEF1F0" />
            <XAxis dataKey="key" tick={BAR_STYLE} axisLine={{ stroke: "#E4E7E6" }} tickLine={false} />
            <YAxis tick={BAR_STYLE} axisLine={false} tickLine={false} tickFormatter={(v: any) => `${v}%`} />
            <Tooltip formatter={(v: any) => `${v}%`} />
            <Line type="monotone" dataKey="avgVariance" name="Avg. Variance" stroke="#C88A15" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}

/* ================================ 5. Contract Expiry ================================ */
interface ExpiryRow extends Omit<TenderRow, "contractEndDate"> { contractEndDate: string; monthsLeft: number; }

export function ExpiryTab({ base, openDrawer }: { base: TenderRow[]; openDrawer: (d: DrawerState) => void }) {
  const [windowMonths, setWindowMonths] = useState<number>(3);
  const wins = base.filter((r): r is TenderRow & { contractEndDate: string } => r.resultStatus === "Win" && !!r.contractEndDate);
  const withMonths: ExpiryRow[] = wins.map((r) => ({ ...r, monthsLeft: monthsBetween(TODAY, new Date(r.contractEndDate)) }));

  const buckets = [
    { label: "Next 3 Months", value: 3 },
    { label: "Next 6 Months", value: 6 },
    { label: "Next 12 Months", value: 12 },
  ];
  const filteredExpiring = withMonths.filter((r) => r.monthsLeft >= 0 && r.monthsLeft <= windowMonths);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {buckets.map((b) => {
          const list = withMonths.filter((r) => r.monthsLeft >= 0 && r.monthsLeft <= b.value);
          return (
            <ClickKpi
              key={b.value}
              label={b.label}
              value={list.length}
              sub="won contracts expiring"
              accent={ACCENT}
              onClick={() => openDrawer({ title: `Contracts expiring — ${b.label}`, rows: list })}
            />
          );
        })}
      </div>
      <Panel title="Expiring contracts (our wins)" action={<Segmented value={windowMonths} onChange={setWindowMonths} options={[{ value: 3, label: "3 mo" }, { value: 6, label: "6 mo" }, { value: 12, label: "12 mo" }]} />}>
        {filteredExpiring.length === 0 ? (
          <div className="rounded-md border border-dashed border-[#DEE3E2] py-10 text-center text-[13px] text-[#8B9895]">No won contracts expire within this window under the current filters.</div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-[#E4E7E6]">
            <table className="w-full min-w-[760px] text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-[#E4E7E6] bg-[#F7F8F7] text-[10.5px] uppercase tracking-[0.06em] text-[#7C8A87]">
                  <th className="px-3 py-2 font-semibold">Tender No.</th>
                  <th className="px-3 py-2 font-semibold">End User</th>
                  <th className="px-3 py-2 font-semibold">State</th>
                  <th className="px-3 py-2 font-semibold">Contract End</th>
                  <th className="px-3 py-2 text-right font-semibold">Months Left</th>
                </tr>
              </thead>
              <tbody>
                {[...filteredExpiring].sort((a, b) => a.monthsLeft - b.monthsLeft).map((r) => (
                  <tr key={r.id} className="border-b border-[#EEF1F0] last:border-0 hover:bg-[#F7FAF9]">
                    <td className="px-3 py-2 font-medium text-[#0F1E1C]">{r.tenderNo}</td>
                    <td className="max-w-[300px] truncate px-3 py-2 text-[#3E4E4B]" title={r.endUser ?? undefined}>{r.endUser ?? "—"}</td>
                    <td className="px-3 py-2 text-[#3E4E4B]">{r.state ?? "—"}</td>
                    <td className="px-3 py-2 text-[#3E4E4B]">{new Date(r.contractEndDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-[#3E4E4B]">{r.monthsLeft}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

/* ================================ 6. Opportunities ================================ */
export function OpportunityTab({ rows, openDrawer }: { rows: TenderRow[]; openDrawer: (d: DrawerState) => void }) {
  const years = uniqNum(rows.map((r) => (r.tenderOpenDate ? new Date(r.tenderOpenDate).getFullYear() : null)));
  const yearOfRow = (r: TenderRow) => (r.tenderOpenDate ? new Date(r.tenderOpenDate).getFullYear() : null);
  const data = years.map((y) => ({ year: y, count: rows.filter((r) => yearOfRow(r) === y).length }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {data.map((y) => (
          <ClickKpi
            key={y.year}
            label={`Total Opportunities ${y.year}`}
            value={y.count}
            accent={ACCENT}
            onClick={() => openDrawer({ title: `Opportunities — ${y.year}`, rows: rows.filter((r) => yearOfRow(r) === y.year) })}
          />
        ))}
      </div>
      <Panel title="Opportunities by year">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid vertical={false} stroke="#EEF1F0" />
            <XAxis dataKey="year" tick={BAR_STYLE} axisLine={{ stroke: "#E4E7E6" }} tickLine={false} />
            <YAxis tick={BAR_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" name="Opportunities" fill={ACCENT} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}

/* ================================ 7. Brand Contribution ================================ */
interface BrandRow { brand: string; total: number; share: string; [year: number]: number | string; }

export function BrandTab({ rows }: { rows: TenderRow[] }) {
  const wins = rows.filter((r): r is TenderRow & { awardedAmount: number } => r.resultStatus === "Win" && r.awardedAmount != null);
  const brands = uniqStr(wins.map((r) => r.awardedBrand ?? r.proposedBrand));
  const yearOfRow = (r: TenderRow) => (r.tenderOpenDate ? new Date(r.tenderOpenDate).getFullYear() : null);
  const years = uniqNum(wins.map(yearOfRow));
  const totalAll = wins.reduce((s, r) => s + r.awardedAmount, 0);

  const byBrandYear: BrandRow[] = brands.map((b) => {
    const brandRows = wins.filter((r) => (r.awardedBrand ?? r.proposedBrand) === b);
    const total = brandRows.reduce((s, r) => s + r.awardedAmount, 0);
    const perYear: Record<number, number> = {};
    years.forEach((y) => { perYear[y] = brandRows.filter((r) => yearOfRow(r) === y).reduce((s, r) => s + r.awardedAmount, 0); });
    return { brand: b, total, share: totalAll ? ((total / totalAll) * 100).toFixed(1) : "0.0", ...perYear };
  });

  const topBrand = [...byBrandYear].sort((a, b) => b.total - a.total)[0];

  const trendData = years.map((y) => {
    const row: Record<string, number | string> = { year: y };
    brands.forEach((b) => { row[b] = (byBrandYear.find((x) => x.brand === b)?.[y] as number) || 0; });
    return row;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Kpi label="Total Awarded (All Brands)" value={fmtMYR(totalAll)} accent={ACCENT} />
        <Kpi label="Brands Contributing" value={brands.length} />
        <Kpi label="Top Brand" value={topBrand?.brand ?? "—"} sub={topBrand ? `${topBrand.share}% share` : undefined} />
      </div>

      <Panel title="Contribution trend by year">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={trendData}>
            <CartesianGrid vertical={false} stroke="#EEF1F0" />
            <XAxis dataKey="year" tick={BAR_STYLE} axisLine={{ stroke: "#E4E7E6" }} tickLine={false} />
            <YAxis tick={BAR_STYLE} axisLine={false} tickLine={false} tickFormatter={(v: any) => `${(Number(v) / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: any) => fmtMYR(Number(v))} />
            <Legend />
            {brands.map((b, i) => <Bar key={b} dataKey={b} stackId="a" fill={SERIES_PALETTE[i % SERIES_PALETTE.length]} radius={i === brands.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />)}
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <div className="grid grid-cols-2 gap-6">
        <Panel title="Share of awarded value by brand">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={byBrandYear} dataKey="total" nameKey="brand" innerRadius={60} outerRadius={95} paddingAngle={2}>
                {byBrandYear.map((b, i) => <Cell key={b.brand} fill={SERIES_PALETTE[i % SERIES_PALETTE.length]} />)}
              </Pie>
              <Legend />
              <Tooltip formatter={(v: any) => fmtMYR(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Brand summary">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-[#E4E7E6] text-[10.5px] uppercase tracking-[0.06em] text-[#7C8A87]">
                <th className="py-2 font-semibold">Brand</th>
                <th className="py-2 text-right font-semibold">Total Awarded</th>
                <th className="py-2 text-right font-semibold">Share</th>
              </tr>
            </thead>
            <tbody>
              {[...byBrandYear].sort((a, b) => b.total - a.total).map((b) => (
                <tr key={b.brand} className="border-b border-[#EEF1F0] last:border-0">
                  <td className="py-2 font-medium text-[#0F1E1C]">{b.brand}</td>
                  <td className="py-2 text-right tabular-nums text-[#3E4E4B]">{fmtMYR(b.total)}</td>
                  <td className="py-2 text-right tabular-nums text-[#3E4E4B]">{b.share}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}

/* ================================ 8. Sales Performance ================================ */
export function SalesTab({ rows }: { rows: TenderRow[] }) {
  const people = uniqStr(rows.map((r) => r.sales));
  const data = people.map((p) => {
    const personRows = rows.filter((r) => r.sales === p);
    const decided = personRows.filter((r) => r.resultStatus === "Win" || r.resultStatus === "Lose");
    const wins = personRows.filter((r) => r.resultStatus === "Win");
    return {
      name: p,
      opportunities: personRows.length,
      wins: wins.length,
      winRate: decided.length ? +((wins.length / decided.length) * 100).toFixed(1) : 0,
      awarded: wins.reduce((s, r) => s + (r.awardedAmount ?? 0), 0),
    };
  }).sort((a, b) => b.awarded - a.awarded);

  return (
    <div className="space-y-6">
      <Panel title="Total awarded amount by salesperson">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid horizontal={false} stroke="#EEF1F0" />
            <XAxis type="number" tick={BAR_STYLE} axisLine={{ stroke: "#E4E7E6" }} tickLine={false} tickFormatter={(v: any) => `${(Number(v) / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="name" tick={BAR_STYLE} axisLine={false} tickLine={false} width={80} />
            <Tooltip formatter={(v: any) => fmtMYR(Number(v))} />
            <Bar dataKey="awarded" name="Awarded Amount" fill={ACCENT} radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title="Salesperson breakdown">
        <div className="overflow-x-auto rounded-md border border-[#E4E7E6]">
          <table className="w-full min-w-[640px] text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-[#E4E7E6] bg-[#F7F8F7] text-[10.5px] uppercase tracking-[0.06em] text-[#7C8A87]">
                <th className="px-3 py-2 font-semibold">Salesperson</th>
                <th className="px-3 py-2 text-right font-semibold">Opportunities</th>
                <th className="px-3 py-2 text-right font-semibold">Wins</th>
                <th className="px-3 py-2 text-right font-semibold">Win Rate</th>
                <th className="px-3 py-2 text-right font-semibold">Total Awarded</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.name} className="border-b border-[#EEF1F0] last:border-0 hover:bg-[#F7FAF9]">
                  <td className="px-3 py-2 font-medium text-[#0F1E1C]">{p.name}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-[#3E4E4B]">{p.opportunities}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-[#3E4E4B]">{p.wins}</td>
                  <td className="px-3 py-2 text-right tabular-nums" style={{ color: STATUS_COLORS.Win }}>{p.winRate}%</td>
                  <td className="px-3 py-2 text-right tabular-nums text-[#3E4E4B]">{fmtMYR(p.awarded)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}