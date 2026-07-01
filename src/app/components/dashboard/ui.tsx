"use client";

import React from "react";
import { ChevronRight, X } from "lucide-react";
import type { TenderRow } from "@/app/types/tender";
import { fmtMYR, statusColor } from "@/app/lib/tenders/utils";

/**
 * Generic, dumb UI building blocks shared by every dashboard tab.
 * These know nothing about tenders except how to render a TenderRow list —
 * new tabs should reuse these rather than writing new card/table markup.
 */

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5F7A76]">{children}</div>;
}

export interface KpiProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: string;
}

export function Kpi({ label, value, sub, accent }: KpiProps) {
  return (
    <div className="rounded-lg border border-[#E4E7E6] bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,30,28,0.04)]">
      <Eyebrow>{label}</Eyebrow>
      <div className="mt-1.5 text-[28px] font-semibold leading-none tabular-nums text-[#0F1E1C]" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      {sub != null && <div className="mt-1 text-[12.5px] text-[#7C8A87]">{sub}</div>}
    </div>
  );
}

export interface ClickKpiProps extends KpiProps {
  onClick: () => void;
}

export function ClickKpi({ label, value, sub, accent, onClick }: ClickKpiProps) {
  return (
    <button
      onClick={onClick}
      className="group w-full rounded-lg border border-[#E4E7E6] bg-white px-5 py-4 text-left shadow-[0_1px_2px_rgba(15,30,28,0.04)] transition hover:border-[#0E5C56] hover:shadow-[0_2px_10px_rgba(14,92,86,0.12)]"
    >
      <div className="flex items-center justify-between">
        <Eyebrow>{label}</Eyebrow>
        <ChevronRight size={14} className="text-[#B7C2C0] transition group-hover:text-[#0E5C56]" />
      </div>
      <div className="mt-1.5 text-[28px] font-semibold leading-none tabular-nums text-[#0F1E1C]" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      {sub != null && <div className="mt-1 text-[12.5px] text-[#7C8A87]">{sub}</div>}
    </button>
  );
}

export function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#E4E7E6] bg-white p-5 shadow-[0_1px_2px_rgba(15,30,28,0.04)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[13.5px] font-semibold text-[#0F1E1C]">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export interface SegmentedOption<T> {
  value: T;
  label: string;
}

export function Segmented<T extends string | number>({ options, value, onChange }: { options: SegmentedOption<T>[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-md border border-[#E4E7E6] bg-[#F3F5F4] p-0.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={`rounded-[5px] px-3 py-1 text-[12px] font-medium transition ${
            value === o.value ? "bg-white text-[#0F1E1C] shadow-sm" : "text-[#6B7A78] hover:text-[#0F1E1C]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function StatusPill({ status }: { status: string | null }) {
  const c = statusColor(status);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: c + "18", color: c }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c }} />
      {status ?? "Not Participate"}
    </span>
  );
}

export function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: (string | number)[] }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#8B9895]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-md border border-[#DEE3E2] bg-white px-2.5 py-1.5 text-[12.5px] text-[#0F1E1C] outline-none transition focus:border-[#0E5C56]"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={String(o)} value={String(o)}>{o}</option>
        ))}
      </select>
    </label>
  );
}

export function TenderTable({ rows }: { rows: TenderRow[] }) {
  if (!rows.length) {
    return <div className="rounded-md border border-dashed border-[#DEE3E2] py-10 text-center text-[13px] text-[#8B9895]">No records match this selection.</div>;
  }
  return (
    <div className="overflow-x-auto rounded-md border border-[#E4E7E6]">
      <table className="w-full min-w-[860px] text-left text-[12.5px]">
        <thead>
          <tr className="border-b border-[#E4E7E6] bg-[#F7F8F7] text-[10.5px] uppercase tracking-[0.06em] text-[#7C8A87]">
            <th className="px-3 py-2 font-semibold">Tender No.</th>
            <th className="px-3 py-2 font-semibold">End User</th>
            <th className="px-3 py-2 font-semibold">State</th>
            <th className="px-3 py-2 font-semibold">Marketing</th>
            <th className="px-3 py-2 font-semibold">Sales</th>
            <th className="px-3 py-2 font-semibold">Status</th>
            <th className="px-3 py-2 text-right font-semibold">Awarded Amount</th>
            <th className="px-3 py-2 font-semibold">Awarded Brand</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-[#EEF1F0] last:border-0 hover:bg-[#F7FAF9]">
              <td className="px-3 py-2 font-medium text-[#0F1E1C]">{r.tenderNo}</td>
              <td className="max-w-[260px] truncate px-3 py-2 text-[#3E4E4B]" title={r.endUser ?? undefined}>{r.endUser ?? "—"}</td>
              <td className="px-3 py-2 text-[#3E4E4B]">{r.state ?? "—"}</td>
              <td className="px-3 py-2 text-[#3E4E4B]">{r.marketing ?? "—"}</td>
              <td className="px-3 py-2 text-[#3E4E4B]">{r.sales ?? "—"}</td>
              <td className="px-3 py-2"><StatusPill status={r.resultStatus} /></td>
              <td className="px-3 py-2 text-right tabular-nums text-[#3E4E4B]">{fmtMYR(r.awardedAmount)}</td>
              <td className="px-3 py-2 text-[#3E4E4B]">{r.awardedBrand ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Drawer({ title, rows, onClose }: { title: string; rows: TenderRow[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#E4E7E6] px-5 py-4">
          <div>
            <Eyebrow>Tender List</Eyebrow>
            <h2 className="mt-0.5 text-[16px] font-semibold text-[#0F1E1C]">{title}</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-[#8B9895] hover:bg-[#F3F5F4] hover:text-[#0F1E1C]">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-3 text-[12.5px] text-[#7C8A87]">{rows.length} tender{rows.length !== 1 ? "s" : ""}</div>
          <TenderTable rows={rows} />
        </div>
      </div>
    </div>
  );
}

export const BAR_STYLE = { fontSize: 11.5, fill: "#5C6D6A" };