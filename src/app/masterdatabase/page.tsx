"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Filter, Loader2, AlertTriangle, RotateCcw } from "lucide-react";
import type { DrawerState, Filters } from "../types/tender";
import { useTenderData } from "../lib/tenders/api";
import { NAV, uniqNum, uniqStr, yearOf } from "../lib/tenders/utils";
import { Drawer, Select } from "../components/dashboard/ui";
import {
  ForecastTab, StatusTab, WinLoseTab, ValueTab, ExpiryTab,
  OpportunityTab, BrandTab, SalesTab, WinRatePulse,
} from "../components/dashboard/tabs";

/**
 * This page only wires things together: fetch data, apply global filters,
 * pick which tab to render. All calculation logic lives in
 * lib/tenders/utils.ts and components/dashboard/tabs.tsx — edit those
 * when you need new metrics or a new dashboard, not this file.
 */
export default function TenderDashboardPage() {
  const { rows: allRows, loading, error } = useTenderData();
  const [tab, setTab] = useState<string>("forecast");
  const [filters, setFilters] = useState<Filters>({ year: "", state: "", marketing: "", sales: "", brand: "" });
  const [drawer, setDrawer] = useState<DrawerState | null>(null);

  const opts = useMemo(() => ({
    years: uniqNum(allRows.map((r) => yearOf(r.tenderOpenDate))),
    states: uniqStr(allRows.map((r) => r.state)),
    marketing: uniqStr(allRows.map((r) => r.marketing)),
    sales: uniqStr(allRows.map((r) => r.sales)),
    brands: uniqStr(allRows.map((r) => r.awardedBrand ?? r.proposedBrand)),
  }), [allRows]);

  // Global slice: state / marketing / sales / brand always apply.
  // Year applies against tenderOpenDate by default; Forecast & Expiry tabs
  // reason over their own date fields, so they ignore the global Year filter.
  const base = useMemo(() => allRows.filter((r) => {
    if (filters.state && r.state !== filters.state) return false;
    if (filters.marketing && r.marketing !== filters.marketing) return false;
    if (filters.sales && r.sales !== filters.sales) return false;
    if (filters.brand && (r.awardedBrand ?? r.proposedBrand) !== filters.brand) return false;
    return true;
  }), [allRows, filters]);

  const scoped = useMemo(() => base.filter((r) => !filters.year || yearOf(r.tenderOpenDate) === Number(filters.year)), [base, filters.year]);

  const resetFilters = () => setFilters({ year: "", state: "", marketing: "", sales: "", brand: "" });
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex h-full min-h-[720px] w-full items-center justify-center rounded-xl border border-[#E4E7E6] bg-[#F7F8F7]">
        <div className="flex items-center gap-2 text-[#5F7A76]">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-[13px]">Loading tender data…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full min-h-[720px] w-full items-center justify-center rounded-xl border border-[#E4E7E6] bg-[#F7F8F7]">
        <div className="flex max-w-sm flex-col items-center gap-2 text-center text-[#B44439]">
          <AlertTriangle size={22} />
          <p className="text-[13.5px] font-medium">Couldn&apos;t load tender data</p>
          <p className="text-[12px] text-[#7C8A87]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[720px] w-full overflow-hidden rounded-xl border border-[#E4E7E6] bg-[#F7F8F7]">
      {/* ---------------- Sidebar ---------------- */}
      <aside className="flex w-[228px] shrink-0 flex-col bg-[#0B211E] text-white">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#8FB8AF]">Tender Ops</div>
          <div className="mt-0.5 text-[16px] font-semibold">Pipeline Console</div>
        </div>

        <WinRatePulse rows={scoped} />

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = tab === n.key;
            const itemClasses = `flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[12.5px] font-medium transition ${
              active ? "bg-white/10 text-white" : "text-[#9FB4B0] hover:bg-white/5 hover:text-white"
            }`;

            // Entries with an href navigate to a separate route (e.g. the
            // full-table page) instead of switching the in-page tab.
            if (n.href) {
              return (
                <Link key={n.key} href={n.href} className={itemClasses}>
                  <Icon size={15} className="text-[#6E8683]" />
                  {n.label}
                </Link>
              );
            }

            return (
              <button
                key={n.key}
                onClick={() => setTab(n.key)}
                className={itemClasses}
              >
                <Icon size={15} className={active ? "text-[#5FCBB8]" : "text-[#6E8683]"} />
                {n.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-5 py-4 text-[11px] text-[#6E8683]">
          Data as of {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
        </div>
      </aside>

      {/* ---------------- Main ---------------- */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Filter bar */}
        <div className="flex items-center gap-4 border-b border-[#E4E7E6] bg-white px-6 py-3">
          <div className="flex items-center gap-1.5 text-[#0E5C56]">
            <Filter size={14} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em]">Filters</span>
          </div>
          <Select label="Year" value={filters.year} onChange={(v) => setFilters((f) => ({ ...f, year: v }))} options={opts.years} />
          <Select label="State" value={filters.state} onChange={(v) => setFilters((f) => ({ ...f, state: v }))} options={opts.states} />
          <Select label="Marketing" value={filters.marketing} onChange={(v) => setFilters((f) => ({ ...f, marketing: v }))} options={opts.marketing} />
          <Select label="Salesperson" value={filters.sales} onChange={(v) => setFilters((f) => ({ ...f, sales: v }))} options={opts.sales} />
          <Select label="Awarded Brand" value={filters.brand} onChange={(v) => setFilters((f) => ({ ...f, brand: v }))} options={opts.brands} />
          {activeFilterCount > 0 && (
            <button onClick={resetFilters} className="ml-1 flex items-center gap-1 rounded-md border border-[#E4E7E6] px-2.5 py-1.5 text-[11.5px] font-medium text-[#6B7A78] hover:border-[#0E5C56] hover:text-[#0E5C56]">
              <RotateCcw size={12} /> Reset
            </button>
          )}
          <div className="ml-auto text-[12px] text-[#8B9895]">{scoped.length} of {allRows.length} tenders in view</div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {tab === "forecast" && <ForecastTab base={base} openDrawer={setDrawer} />}
          {tab === "status" && <StatusTab rows={scoped} openDrawer={setDrawer} />}
          {tab === "winlose" && <WinLoseTab rows={base} />}
          {tab === "value" && <ValueTab rows={base} />}
          {tab === "expiry" && <ExpiryTab base={base} openDrawer={setDrawer} />}
          {tab === "opportunity" && <OpportunityTab rows={base} openDrawer={setDrawer} />}
          {tab === "brand" && <BrandTab rows={base} />}
          {tab === "salesperson" && <SalesTab rows={base} />}
        </div>
      </div>

      {drawer && <Drawer title={drawer.title} rows={drawer.rows} onClose={() => setDrawer(null)} />}
    </div>
  );
}