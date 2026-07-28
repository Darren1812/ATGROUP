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
  const [period, setPeriod] = useState<"month" | "quarter" | "half">("month");

  // 🆕 「未来 N 个月」的时间窗口，默认 6 个月，用户可以自己打数字
  const [upcomingWindowMonths, setUpcomingWindowMonths] = useState<number>(6);
  const [windowInput, setWindowInput] = useState<string>("6");

  // 🆕 年份多选筛选，空集合 = 显示全部年份（默认状态）
  const [selectedYears, setSelectedYears] = useState<Set<number>>(new Set());

  const allUpcoming = base.filter((r) => r.expectedTenderOpenDate && (parseDate(r.expectedTenderOpenDate) as Date) >= TODAY);

  // 🆕 KPI 用的「未来 N 个月」窗口数据
  const windowedUpcoming = useMemo(() => {
    const cutoff = new Date(TODAY);
    cutoff.setMonth(cutoff.getMonth() + upcomingWindowMonths);
    return allUpcoming.filter((r) => (parseDate(r.expectedTenderOpenDate) as Date) <= cutoff);
  }, [allUpcoming, upcomingWindowMonths]);

  const totalUpcoming = windowedUpcoming.length;
  const totalPipelineValue = windowedUpcoming.reduce((s, r) => s + (r.budget ?? 0), 0);
  const avgBudget = totalUpcoming ? totalPipelineValue / totalUpcoming : 0;

  // 🆕 年份多选影响的是下面所有图表，跟上面 KPI 窗口是分开的两套筛选
  const yearOfRow = (r: TenderRow) => (r.expectedTenderOpenDate ? new Date(r.expectedTenderOpenDate).getFullYear() : null);
  const availableYears = useMemo(() => uniqNum(allUpcoming.map(yearOfRow)), [allUpcoming]);

  const chartUpcoming = useMemo(() => {
    if (selectedYears.size === 0) return allUpcoming; // 空集合 = 全选
    return allUpcoming.filter((r) => {
      const y = yearOfRow(r);
      return y != null && selectedYears.has(y);
    });
  }, [allUpcoming, selectedYears]);

  const toggleYear = (y: number) => {
    setSelectedYears((prev) => {
      const next = new Set(prev);
      next.has(y) ? next.delete(y) : next.add(y);
      return next;
    });
  };

  const keyOf = (r: TenderRow): string => {
    if (period === "month") return monthOf(r.expectedTenderOpenDate) ?? "—";
    const y = r.expectedTenderOpenDate ? new Date(r.expectedTenderOpenDate).getFullYear() : "";
    return period === "quarter"
      ? `${y} Q${quarterOf(r.expectedTenderOpenDate)}`
      : `${y} ${halfOf(r.expectedTenderOpenDate)}`;
  };

  const buckets = useMemo(() => {
    const keys = Array.from(new Set(chartUpcoming.map(keyOf))).sort((a, b) => a.localeCompare(b));
    return keys.map((key) => {
      const g = chartUpcoming.filter((r) => keyOf(r) === key);
      return {
        key,
        count: g.length,
        value: g.reduce((s, r) => s + (r.budget ?? 0), 0),
      };
    });
  }, [chartUpcoming, period]);

  // 按 State 分布（跟随年份筛选）
  const states = uniqStr(chartUpcoming.map((r) => r.state));
  const stateData = states
    .map((s) => ({ state: s, count: chartUpcoming.filter((r) => r.state === s).length }))
    .sort((a, b) => b.count - a.count);

  // 🆕 处理「未来 N 个月」输入框的确认（Enter 或 blur 时生效）
  const commitWindowInput = () => {
    const n = parseInt(windowInput, 10);
    if (!isNaN(n) && n > 0) {
      setUpcomingWindowMonths(n);
    } else {
      setWindowInput(String(upcomingWindowMonths)); // 输入不合法就还原
    }
  };

  return (
    <div className="space-y-6">
      {/* 🆕 未来窗口设置：默认 6 个月，用户可自行输入 */}
      <div className="flex items-center justify-between rounded-lg border border-[#E4E7E6] bg-white px-4 py-2.5">
        <div className="text-[12.5px] text-[#7C8A87]">
          KPIs below reflect opportunities expected to open within the next window.
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-[#5F7A76]">Show next</span>
          <input
            type="number"
            min={1}
            value={windowInput}
            onChange={(e) => setWindowInput(e.target.value)}
            onBlur={commitWindowInput}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitWindowInput();
            }}
            className="w-16 rounded-md border border-[#DEE3E2] bg-white px-2 py-1 text-center text-[12.5px] text-[#0F1E1C] outline-none focus:border-[#0E5C56]"
          />
          <span className="text-[12px] font-medium text-[#5F7A76]">month(s)</span>
          <div className="ml-1 flex gap-1">
            {[3, 6, 12].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setUpcomingWindowMonths(m);
                  setWindowInput(String(m));
                }}
                className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${
                  upcomingWindowMonths === m
                    ? "bg-[#0E5C56] text-white"
                    : "bg-[#F3F5F4] text-[#6B7A78] hover:text-[#0F1E1C]"
                }`}
              >
                {m}mo
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <ClickKpi
          label="Total Upcoming"
          value={totalUpcoming}
          sub={`within next ${upcomingWindowMonths} month(s)`}
          accent={ACCENT}
          onClick={() => openDrawer({ title: `Forecast — Next ${upcomingWindowMonths} Month(s)`, rows: windowedUpcoming })}
        />
        <Kpi label="Pipeline Value" value={fmtMYR(totalPipelineValue)} sub="total budgeted" accent={ACCENT} />
        <Kpi label="Avg. Budget / Tender" value={fmtMYR(avgBudget)} />
        <Kpi label="Nearest Period" value={buckets[0]?.key ?? "—"} sub={buckets[0] ? `${buckets[0].count} tender(s)` : "No forecast data"} />
      </div>

      <Panel
        title="Upcoming tenders by period"
        action={
          <div className="flex items-center gap-3">
            {/* 🆕 年份多选筛选 chip */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-[#8B9895]">Year:</span>
              {availableYears.map((y) => {
                const active = selectedYears.size === 0 || selectedYears.has(y);
                return (
                  <button
                    key={y}
                    onClick={() => toggleYear(y)}
                    className={`rounded-md border px-2 py-1 text-[11.5px] font-medium transition ${
                      active
                        ? "border-[#0E5C56] bg-[#0E5C56]/10 text-[#0E5C56]"
                        : "border-[#DEE3E2] bg-white text-[#8B9895] hover:text-[#0F1E1C]"
                    }`}
                  >
                    {y}
                  </button>
                );
              })}
              {selectedYears.size > 0 && (
                <button
                  onClick={() => setSelectedYears(new Set())}
                  className="ml-1 text-[11px] font-medium text-[#8B9895] underline hover:text-[#0F1E1C]"
                >
                  Reset
                </button>
              )}
            </div>
            <Segmented
              value={period}
              onChange={setPeriod}
              options={[
                { value: "month", label: "Month" },
                { value: "quarter", label: "Quarter" },
                { value: "half", label: "Half-Year" },
              ]}
            />
          </div>
        }
      >
        {buckets.length === 0 ? (
          <div className="rounded-md border border-dashed border-[#DEE3E2] py-10 text-center text-[13px] text-[#8B9895]">
            No upcoming tenders match the current filters.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={buckets}>
              <CartesianGrid vertical={false} stroke="#EEF1F0" />
              <XAxis dataKey="key" tick={BAR_STYLE} axisLine={{ stroke: "#E4E7E6" }} tickLine={false} />
              <YAxis tick={BAR_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip formatter={(v: any) => [`${v} tender(s)`, "Count"]} />
              <Bar
                dataKey="count"
                name="Tenders"
                fill={ACCENT}
                radius={[3, 3, 0, 0]}
                onClick={(data: any) => {
                  const key = data?.payload?.key ?? data?.key;
                  openDrawer({ title: `Forecast — ${key}`, rows: chartUpcoming.filter((r) => keyOf(r) === key) });
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Panel>

      <Panel title="Forecasted pipeline value by period">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={buckets}>
            <CartesianGrid vertical={false} stroke="#EEF1F0" />
            <XAxis dataKey="key" tick={BAR_STYLE} axisLine={{ stroke: "#E4E7E6" }} tickLine={false} />
            <YAxis tick={BAR_STYLE} axisLine={false} tickLine={false} tickFormatter={(v: any) => `${(Number(v) / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: any) => fmtMYR(Number(v))} />
            <Line type="monotone" dataKey="value" name="Pipeline Value" stroke="#C88A15" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      <div className="grid grid-cols-2 gap-6">
        <Panel title="Upcoming tenders by state">
          {stateData.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#DEE3E2] py-10 text-center text-[13px] text-[#8B9895]">
              No state data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stateData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid horizontal={false} stroke="#EEF1F0" />
                <XAxis type="number" tick={BAR_STYLE} axisLine={{ stroke: "#E4E7E6" }} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="state" tick={BAR_STYLE} axisLine={false} tickLine={false} width={100} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  name="Tenders"
                  fill={ACCENT}
                  radius={[0, 3, 3, 0]}
                  onClick={(data: any) => {
                    const state = data?.payload?.state ?? data?.state;
                    openDrawer({ title: `Forecast — ${state}`, rows: chartUpcoming.filter((r) => r.state === state) });
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Quick access by period">
          <div className="grid grid-cols-2 gap-3">
            {buckets.map((b) => (
              <ClickKpi
                key={b.key}
                label={b.key}
                value={b.count}
                sub={fmtMYR(b.value)}
                accent={ACCENT}
                onClick={() => openDrawer({ title: `Forecast — ${b.key}`, rows: chartUpcoming.filter((r) => keyOf(r) === b.key) })}
              />
            ))}
          </div>
        </Panel>
      </div>
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

  // 🆕 年份多选筛选，空集合 = 显示全部年份
  const [selectedYears, setSelectedYears] = useState<Set<number>>(new Set());

  const allDecided = rows.filter((r) => r.resultStatus === "Win" || r.resultStatus === "Lose");

  const yearOfRow = (r: TenderRow) => (r.tenderOpenDate ? new Date(r.tenderOpenDate).getFullYear() : null);
  const availableYears = useMemo(() => uniqNum(allDecided.map(yearOfRow)), [allDecided]);

  const toggleYear = (y: number) => {
    setSelectedYears((prev) => {
      const next = new Set(prev);
      next.has(y) ? next.delete(y) : next.add(y);
      return next;
    });
  };

  const decided = useMemo(() => {
    if (selectedYears.size === 0) return allDecided;
    return allDecided.filter((r) => {
      const y = yearOfRow(r);
      return y != null && selectedYears.has(y);
    });
  }, [allDecided, selectedYears]);

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
      <Panel
        title="Win vs Lose over time"
        action={
          <div className="flex items-center gap-3">
            {/* 🆕 年份多选筛选 chip */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-[#8B9895]">Year:</span>
              {availableYears.map((y) => {
                const active = selectedYears.size === 0 || selectedYears.has(y);
                return (
                  <button
                    key={y}
                    onClick={() => toggleYear(y)}
                    className={`rounded-md border px-2 py-1 text-[11.5px] font-medium transition ${
                      active
                        ? "border-[#0E5C56] bg-[#0E5C56]/10 text-[#0E5C56]"
                        : "border-[#DEE3E2] bg-white text-[#8B9895] hover:text-[#0F1E1C]"
                    }`}
                  >
                    {y}
                  </button>
                );
              })}
              {selectedYears.size > 0 && (
                <button
                  onClick={() => setSelectedYears(new Set())}
                  className="ml-1 text-[11px] font-medium text-[#8B9895] underline hover:text-[#0F1E1C]"
                >
                  Reset
                </button>
              )}
            </div>
            <Segmented value={period} onChange={setPeriod} options={[{ value: "year", label: "Year" }, { value: "quarter", label: "Quarter" }, { value: "half", label: "Half-Year" }]} />
          </div>
        }
      >
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

  // 🆕 年份多选筛选，空集合 = 显示全部年份（默认状态），跟 Forecast 分页保持一致的交互
  const [selectedYears, setSelectedYears] = useState<Set<number>>(new Set());

  const wins = rows.filter((r) => r.resultStatus === "Win" && r.awardedAmount != null);

  const yearOfRow = (r: TenderRow) => (r.tenderOpenDate ? new Date(r.tenderOpenDate).getFullYear() : null);
  const years = uniqNum(wins.map(yearOfRow));

  const toggleYear = (y: number) => {
    setSelectedYears((prev) => {
      const next = new Set(prev);
      next.has(y) ? next.delete(y) : next.add(y);
      return next;
    });
  };

  // 🆕 空集合视为「全选」，否则只保留被勾选的年份
  const scopedRows = useMemo(() => {
    if (selectedYears.size === 0) return wins;
    return wins.filter((r) => {
      const y = yearOfRow(r);
      return y != null && selectedYears.has(y);
    });
  }, [wins, selectedYears]);

  const keyOf = (r: TenderRow): string => {
    const y = r.tenderOpenDate ? new Date(r.tenderOpenDate).getFullYear() : "—";
    return period === "month" ? (monthOf(r.tenderOpenDate) ?? "—")
      : period === "quarter" ? `${y} Q${quarterOf(r.tenderOpenDate)}`
      : period === "half" ? `${y} ${halfOf(r.tenderOpenDate)}`
      : String(y);
  };

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
        <Kpi label="Won Tenders" value={scopedRows.length} />
        <Kpi label="Avg. Variance" value={avgVarianceOverall != null ? `${avgVarianceOverall}%` : "—"} sub="vs. budget" />
      </div>
      <Panel
        title="Awarded amount by period"
        action={
          <div className="flex items-center gap-3">
            {/* 🆕 年份多选筛选 chip，取代原本的单选 <select> */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-[#8B9895]">Year:</span>
              {years.map((y) => {
                const active = selectedYears.size === 0 || selectedYears.has(y);
                return (
                  <button
                    key={y}
                    onClick={() => toggleYear(y)}
                    className={`rounded-md border px-2 py-1 text-[11.5px] font-medium transition ${
                      active
                        ? "border-[#0E5C56] bg-[#0E5C56]/10 text-[#0E5C56]"
                        : "border-[#DEE3E2] bg-white text-[#8B9895] hover:text-[#0F1E1C]"
                    }`}
                  >
                    {y}
                  </button>
                );
              })}
              {selectedYears.size > 0 && (
                <button
                  onClick={() => setSelectedYears(new Set())}
                  className="ml-1 text-[11px] font-medium text-[#8B9895] underline hover:text-[#0F1E1C]"
                >
                  Reset
                </button>
              )}
            </div>
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
      </Panel>*/
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
  // 🆕 年份多选筛选，空集合 = 显示全部年份
  const [selectedYears, setSelectedYears] = useState<Set<number>>(new Set());

  const yearOfRow = (r: TenderRow) => (r.tenderOpenDate ? new Date(r.tenderOpenDate).getFullYear() : null);
  const availableYears = uniqNum(rows.map(yearOfRow));

  const toggleYear = (y: number) => {
    setSelectedYears((prev) => {
      const next = new Set(prev);
      next.has(y) ? next.delete(y) : next.add(y);
      return next;
    });
  };

  const displayYears = selectedYears.size === 0 ? availableYears : availableYears.filter((y) => selectedYears.has(y));
  const data = displayYears.map((y) => ({ year: y, count: rows.filter((r) => yearOfRow(r) === y).length }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        {/* 🆕 年份多选筛选 chip */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-[#8B9895]">Year:</span>
          {availableYears.map((y) => {
            const active = selectedYears.size === 0 || selectedYears.has(y);
            return (
              <button
                key={y}
                onClick={() => toggleYear(y)}
                className={`rounded-md border px-2 py-1 text-[11.5px] font-medium transition ${
                  active
                    ? "border-[#0E5C56] bg-[#0E5C56]/10 text-[#0E5C56]"
                    : "border-[#DEE3E2] bg-white text-[#8B9895] hover:text-[#0F1E1C]"
                }`}
              >
                {y}
              </button>
            );
          })}
          {selectedYears.size > 0 && (
            <button
              onClick={() => setSelectedYears(new Set())}
              className="ml-1 text-[11px] font-medium text-[#8B9895] underline hover:text-[#0F1E1C]"
            >
              Reset
            </button>
          )}
        </div>
      </div>

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
  // 🆕 年份多选筛选，空集合 = 显示全部年份
  const [selectedYears, setSelectedYears] = useState<Set<number>>(new Set());

  const allWins = rows.filter((r): r is TenderRow & { awardedAmount: number } => r.resultStatus === "Win" && r.awardedAmount != null);
  const yearOfRow = (r: TenderRow) => (r.tenderOpenDate ? new Date(r.tenderOpenDate).getFullYear() : null);
  const availableYears = uniqNum(allWins.map(yearOfRow));

  const toggleYear = (y: number) => {
    setSelectedYears((prev) => {
      const next = new Set(prev);
      next.has(y) ? next.delete(y) : next.add(y);
      return next;
    });
  };

  // 🆕 筛选后的 wins：所有下面的统计（总额、品牌占比、趋势）都基于这个集合
  const wins = useMemo(() => {
    if (selectedYears.size === 0) return allWins;
    return allWins.filter((r) => {
      const y = yearOfRow(r);
      return y != null && selectedYears.has(y);
    });
  }, [allWins, selectedYears]);

  const brands = uniqStr(wins.map((r) => r.awardedBrand ?? r.proposedBrand));
  const years = selectedYears.size === 0 ? availableYears : availableYears.filter((y) => selectedYears.has(y));
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
      <div className="flex items-center justify-end">
        {/* 🆕 年份多选筛选 chip */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-[#8B9895]">Year:</span>
          {availableYears.map((y) => {
            const active = selectedYears.size === 0 || selectedYears.has(y);
            return (
              <button
                key={y}
                onClick={() => toggleYear(y)}
                className={`rounded-md border px-2 py-1 text-[11.5px] font-medium transition ${
                  active
                    ? "border-[#0E5C56] bg-[#0E5C56]/10 text-[#0E5C56]"
                    : "border-[#DEE3E2] bg-white text-[#8B9895] hover:text-[#0F1E1C]"
                }`}
              >
                {y}
              </button>
            );
          })}
          {selectedYears.size > 0 && (
            <button
              onClick={() => setSelectedYears(new Set())}
              className="ml-1 text-[11px] font-medium text-[#8B9895] underline hover:text-[#0F1E1C]"
            >
              Reset
            </button>
          )}
        </div>
      </div>

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
type SalesPeriodType = "none" | "quarter" | "month" | "half";

export function SalesTab({ rows, openDrawer }: { rows: TenderRow[]; openDrawer: (d: DrawerState) => void }) {
  // 🆕 年份多选筛选，空集合 = 显示全部年份
  const [selectedYears, setSelectedYears] = useState<Set<number>>(new Set());
  // 🆕 周期粒度：不细分 / 按季度 / 按月 / 按半年
  const [periodType, setPeriodType] = useState<SalesPeriodType>("none");
  // 🆕 选定粒度后，具体是哪一个周期（例如 "2027 Q2"），空字符串 = 该粒度下全部周期
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");

  const yearOfRow = (r: TenderRow) => (r.tenderOpenDate ? new Date(r.tenderOpenDate).getFullYear() : null);
  const availableYears = useMemo(() => uniqNum(rows.map(yearOfRow)), [rows]);

  const toggleYear = (y: number) => {
    setSelectedYears((prev) => {
      const next = new Set(prev);
      next.has(y) ? next.delete(y) : next.add(y);
      return next;
    });
    setSelectedPeriod("");
  };

  const yearFilteredRows = useMemo(() => {
    if (selectedYears.size === 0) return rows;
    return rows.filter((r) => {
      const y = yearOfRow(r);
      return y != null && selectedYears.has(y);
    });
  }, [rows, selectedYears]);

  const periodKeyOf = (r: TenderRow): string | null => {
    if (!r.tenderOpenDate) return null;
    const y = new Date(r.tenderOpenDate).getFullYear();
    if (periodType === "quarter") return `${y} Q${quarterOf(r.tenderOpenDate)}`;
    if (periodType === "month") return monthOf(r.tenderOpenDate);
    if (periodType === "half") return `${y} ${halfOf(r.tenderOpenDate)}`;
    return null;
  };

  const availablePeriods = useMemo(() => {
    if (periodType === "none") return [];
    const keys = Array.from(new Set(yearFilteredRows.map(periodKeyOf).filter((k): k is string => !!k)));
    return keys.sort((a, b) => a.localeCompare(b));
  }, [yearFilteredRows, periodType]);

  const handlePeriodTypeChange = (t: SalesPeriodType) => {
    setPeriodType(t);
    setSelectedPeriod("");
  };

  // 🆕 最终用来计算图表 / 表格的数据集：年份 → 粒度 → 具体周期 三层递进筛选
  const scopedRows = useMemo(() => {
    let r = yearFilteredRows;
    if (periodType !== "none" && selectedPeriod) {
      r = r.filter((row) => periodKeyOf(row) === selectedPeriod);
    }
    return r;
  }, [yearFilteredRows, periodType, selectedPeriod]);

  const people = uniqStr(scopedRows.map((r) => r.sales));
  const data = people.map((p) => {
    const personRows = scopedRows.filter((r) => r.sales === p);
    const decided = personRows.filter((r) => r.resultStatus === "Win" || r.resultStatus === "Lose");
    const wins = personRows.filter((r) => r.resultStatus === "Win");
    const losses = personRows.filter((r) => r.resultStatus === "Lose");
    return {
      name: p,
      opportunities: personRows.length,
      wins: wins.length,
      losses: losses.length,
      winRate: decided.length ? +((wins.length / decided.length) * 100).toFixed(1) : 0,
      awarded: wins.reduce((s, r) => s + (r.awardedAmount ?? 0), 0),
    };
  }).sort((a, b) => b.awarded - a.awarded);

  // 🆕 点击查看某个业务员在当前筛选范围内的所有 tender
  const openPersonDrawer = (name: string, statusFilter?: "Win" | "Lose") => {
    let personRows = scopedRows.filter((r) => r.sales === name);
    if (statusFilter) personRows = personRows.filter((r) => r.resultStatus === statusFilter);
    const suffix = statusFilter ? ` — ${statusFilter}` : "";
    openDrawer({ title: `Salesperson — ${name}${suffix}`, rows: personRows });
  };

  return (
    <div className="space-y-6">
      {/* 年份 → 粒度 → 具体周期 递进筛选条 */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#E4E7E6] bg-white px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-[#8B9895]">Year:</span>
          {availableYears.map((y) => {
            const active = selectedYears.size === 0 || selectedYears.has(y);
            return (
              <button
                key={y}
                onClick={() => toggleYear(y)}
                className={`rounded-md border px-2 py-1 text-[11.5px] font-medium transition ${
                  active
                    ? "border-[#0E5C56] bg-[#0E5C56]/10 text-[#0E5C56]"
                    : "border-[#DEE3E2] bg-white text-[#8B9895] hover:text-[#0F1E1C]"
                }`}
              >
                {y}
              </button>
            );
          })}
          {selectedYears.size > 0 && (
            <button
              onClick={() => { setSelectedYears(new Set()); setSelectedPeriod(""); }}
              className="ml-1 text-[11px] font-medium text-[#8B9895] underline hover:text-[#0F1E1C]"
            >
              Reset
            </button>
          )}
        </div>

        <div className="h-4 w-px bg-[#E4E7E6]" />

        <Segmented
          value={periodType}
          onChange={handlePeriodTypeChange}
          options={[
            { value: "none", label: "All" },
            { value: "quarter", label: "Quarter" },
            { value: "month", label: "Month" },
            { value: "half", label: "Half-Year" },
          ]}
        />

        {periodType !== "none" && (
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-md border border-[#DEE3E2] bg-white px-2.5 py-1.5 text-[12px] text-[#0F1E1C] outline-none focus:border-[#0E5C56]"
          >
            <option value="">All {periodType === "quarter" ? "quarters" : periodType === "month" ? "months" : "halves"}</option>
            {availablePeriods.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        )}
      </div>

      <Panel title="Total awarded amount by salesperson">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid horizontal={false} stroke="#EEF1F0" />
            <XAxis type="number" tick={BAR_STYLE} axisLine={{ stroke: "#E4E7E6" }} tickLine={false} tickFormatter={(v: any) => `${(Number(v) / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="name" tick={BAR_STYLE} axisLine={false} tickLine={false} width={80} />
            <Tooltip formatter={(v: any) => fmtMYR(Number(v))} />
            <Bar
              dataKey="awarded"
              name="Awarded Amount"
              fill={ACCENT}
              radius={[0, 3, 3, 0]}
              cursor="pointer"
              onClick={(d: any) => openPersonDrawer(d?.payload?.name ?? d?.name, "Win")}
            />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      {/* Win vs Lose 对比图，Lose 用红色 */}
      <Panel title="Win vs Lose by salesperson">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid horizontal={false} stroke="#EEF1F0" />
            <XAxis type="number" tick={BAR_STYLE} axisLine={{ stroke: "#E4E7E6" }} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={BAR_STYLE} axisLine={false} tickLine={false} width={80} />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="wins"
              name="Win"
              fill={STATUS_COLORS.Win}
              radius={[0, 3, 3, 0]}
              cursor="pointer"
              onClick={(d: any) => openPersonDrawer(d?.payload?.name ?? d?.name, "Win")}
            />
            <Bar
              dataKey="losses"
              name="Lose"
              fill={STATUS_COLORS.Lose}
              radius={[0, 3, 3, 0]}
              cursor="pointer"
              onClick={(d: any) => openPersonDrawer(d?.payload?.name ?? d?.name, "Lose")}
            />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Salesperson breakdown">
        <div className="overflow-x-auto rounded-md border border-[#E4E7E6]">
          <table className="w-full min-w-[700px] text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-[#E4E7E6] bg-[#F7F8F7] text-[10.5px] uppercase tracking-[0.06em] text-[#7C8A87]">
                <th className="px-3 py-2 font-semibold">Salesperson</th>
                <th className="px-3 py-2 text-right font-semibold">Opportunities</th>
                <th className="px-3 py-2 text-right font-semibold">Wins</th>
                <th className="px-3 py-2 text-right font-semibold">Losses</th>
                <th className="px-3 py-2 text-right font-semibold">Win Rate</th>
                <th className="px-3 py-2 text-right font-semibold">Total Awarded</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr
                  key={p.name}
                  onClick={() => openPersonDrawer(p.name)}
                  title="Click to view this salesperson's tenders"
                  className="cursor-pointer border-b border-[#EEF1F0] last:border-0 hover:bg-[#F0F7F5] transition"
                >
                  <td className="px-3 py-2 font-medium text-[#0F1E1C]">{p.name}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-[#3E4E4B]">{p.opportunities}</td>
                  <td className="px-3 py-2 text-right tabular-nums" style={{ color: STATUS_COLORS.Win }}>{p.wins}</td>
                  <td className="px-3 py-2 text-right tabular-nums" style={{ color: STATUS_COLORS.Lose }}>{p.losses}</td>
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