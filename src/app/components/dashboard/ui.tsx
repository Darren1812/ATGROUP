"use client";

import React, { useEffect, useState } from "react";
import { ChevronRight, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import type { TenderRow } from "@/app/types/tender";
import { fmtMYR, statusColor } from "@/app/lib/tenders/utils";

const API = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/MdTable`;

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

/**
 * Generic, dumb UI building blocks shared by every dashboard tab.
 * These know nothing about tenders except how to render a TenderRow list —
 * new tabs should reuse these rather than writing new card/table markup.
 *
 * EditTenderModal below is the one exception: it duplicates the edit form
 * from the Master Tender Database page so any dashboard table can offer
 * inline editing without routing back to that page.
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
export function Eyebrow1({ children }: { children: React.ReactNode }) {
  return <div className="text-[23px] font-semibold uppercase tracking-[0.14em] text-[#5F7A76]">{children}</div>;
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
        <Eyebrow1>{label}</Eyebrow1>
        <ChevronRight size={14} className="text-[#B7C2C0] transition group-hover:text-[#0E5C56]" />
      </div>
      <div className="mt-1.5 text-[20px] font-semibold leading-none tabular-nums text-[#0F1E1C]" style={accent ? { color: accent } : undefined}>
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

/* ============================================================
   🆕 EditTenderModal — same fields / validation / API calls as
   the Master Tender Database page's Add/Edit form (Sections 1–5).
   ============================================================ */

const MARKETING_PERSONS = ['Khloe', 'Sonia', 'Syafiqah', 'Natasya'];
const SALES_PERSONS = ['Husni', 'Husna', 'Hannah', 'Nik'];
const COMPANY_OPTIONS = ['ATP', 'ASN', 'ARENA', 'SKY'];
const BRAND_OPTIONS = ['KM', 'Canon'];

interface TenderFormRecord {
  id?: number;
  tenderNo: string;
  endUser?: string | null;
  state?: string | null;
  area?: string | null;
  marketing?: string | null;
  sales?: string | null;
  tenderCategory?: string | null;
  existingVendor?: string | null;
  existingBrand?: string | null;
  existingQuantity?: number | null;
  contractDuration?: string | null;
  contractEndDate?: string | null;
  contractEndDateNext?: string | null;
  expectedTenderOpenDate?: string | null;
  tenderOpenDate?: string | null;
  specsRequirement?: string | null;
  budget?: number | null;
  companyName?: string | null;
  remarkSubmissionprice?: string | null;
  proposedBrand?: string | null;
  updateRemark?: string | null;
  resultStatus?: string | null;
  awardedVendor?: string | null;
  awardedBrand?: string | null;
  awardedAmount?: number | null;
  awardedVariance?: string | null;
}

function toFormRecord(row: TenderRow): TenderFormRecord {
  const r = row as any; // TenderRow may not yet declare every MdTable field — see note above
  return {
    id: r.id,
    tenderNo: r.tenderNo ?? '',
    endUser: r.endUser ?? '',
    state: r.state ?? '',
    area: r.area ?? '',
    marketing: r.marketing ?? '',
    sales: r.sales ?? '',
    tenderCategory: r.tenderCategory ?? '',
    existingVendor: r.existingVendor ?? '',
    existingBrand: r.existingBrand ?? '',
    existingQuantity: r.existingQuantity ?? null,
    contractDuration: r.contractDuration ?? '',
    contractEndDate: r.contractEndDate ? String(r.contractEndDate).split('T')[0] : '',
    contractEndDateNext: r.contractEndDateNext ? String(r.contractEndDateNext).split('T')[0] : '',
    expectedTenderOpenDate: r.expectedTenderOpenDate ? String(r.expectedTenderOpenDate).split('T')[0] : '',
    tenderOpenDate: r.tenderOpenDate ? String(r.tenderOpenDate).split('T')[0] : '',
    specsRequirement: r.specsRequirement ?? '',
    budget: r.budget ?? null,
    companyName: r.companyName ?? '',
    remarkSubmissionprice: r.remarkSubmissionprice ?? '',
    proposedBrand: r.proposedBrand ?? '',
    updateRemark: r.updateRemark ?? '',
    resultStatus: r.resultStatus ?? 'Pending',
    awardedVendor: r.awardedVendor ?? '',
    awardedBrand: r.awardedBrand ?? '',
    awardedAmount: r.awardedAmount ?? null,
    awardedVariance: r.awardedVariance ?? null,
  };
}

export function EditTenderModal({
  row,
  onClose,
  onSaved,
}: {
  row: TenderRow;
  onClose: () => void;
  onSaved?: () => void; // parent should refetch its data after this fires
}) {
  const [formRecord, setFormRecord] = useState<TenderFormRecord>(() => toFormRecord(row));
  const [existingVendors, setExistingVendors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    setFormRecord(toFormRecord(row));
  }, [row]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/existing-vendors`);
        if (res.ok) setExistingVendors(await res.json());
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  const toggleMultiValue = (field: 'companyName' | 'proposedBrand', value: string) => {
    setFormRecord(prev => {
      const current = (prev[field] || '').toString().split(',').map(s => s.trim()).filter(Boolean);
      const exists = current.includes(value);
      const updated = exists ? current.filter(v => v !== value) : [...current, value];
      return { ...prev, [field]: updated.join(', ') };
    });
  };

  const isValueSelected = (field: 'companyName' | 'proposedBrand', value: string) =>
    (formRecord[field] || '').toString().split(',').map(s => s.trim()).includes(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRecord.tenderNo?.trim()) {
      showToast('Tender No. is required.', 'error');
      return;
    }
    if (!formRecord.expectedTenderOpenDate) {
      showToast('Expected Open Date is required.', 'error');
      return;
    }

    const payload = {
      ...formRecord,
      contractEndDate: formRecord.contractEndDate || null,
      contractEndDateNext: formRecord.contractEndDateNext || null,
      expectedTenderOpenDate: formRecord.expectedTenderOpenDate || null,
      tenderOpenDate: formRecord.tenderOpenDate || null,
    };

    setSaving(true);
    try {
      const res = await fetch(`${API}/${formRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        showToast('Tender No. already exists!', 'error');
        setSaving(false);
        return;
      }
      if (!res.ok) throw new Error('Failed to save record.');

      showToast('Record updated successfully.', 'success');
      onSaved?.();
      setTimeout(onClose, 600); // brief pause so the success toast is visible
    } catch (error) {
      showToast('Error saving data row.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {toast && (
          <div className={`absolute top-4 right-4 z-10 flex items-center space-x-2 px-4 py-2.5 rounded-lg shadow-lg text-white text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{toast.message}</span>
          </div>
        )}

        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-900">Edit Tender Record — {row.tenderNo}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 max-h-[560px] overflow-y-auto">

            {/* 1. Opportunity Details */}
            <div className="sm:col-span-3 border-b border-slate-100 pb-1">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">1. Opportunity Details</span>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tender No. * (must be unique)</label>
              <input required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-slate-50" value={formRecord.tenderNo} onChange={e => setFormRecord({ ...formRecord, tenderNo: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">End User</label>
              <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.endUser || ''} onChange={e => setFormRecord({ ...formRecord, endUser: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500" value={formRecord.state || ''} onChange={e => setFormRecord({ ...formRecord, state: e.target.value })}>
                <option value="" disabled>Select a state</option>
                {['Johor','Kedah','Kelantan','Melaka','Negeri Sembilan','Pahang','Penang','Perak','Perlis','Sabah','Sarawak','Selangor','Terengganu','W.P. Kuala Lumpur','W.P. Labuan','W.P. Putrajaya'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Area</label>
              <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.area || ''} onChange={e => setFormRecord({ ...formRecord, area: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Marketing Person</label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500" value={formRecord.marketing || ''} onChange={e => setFormRecord({ ...formRecord, marketing: e.target.value })}>
                <option value="" disabled>Select Marketing Person</option>
                {MARKETING_PERSONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sales Person</label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500" value={formRecord.sales || ''} onChange={e => setFormRecord({ ...formRecord, sales: e.target.value })}>
                <option value="" disabled>Select Sales Person</option>
                {SALES_PERSONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* 2. Category & Current Contract */}
            <div className="sm:col-span-3 border-b border-slate-100 pt-2 pb-1">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">2. Category & Current Contract</span>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tender Category</label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500" value={formRecord.tenderCategory || ''} onChange={e => setFormRecord({ ...formRecord, tenderCategory: e.target.value })}>
                <option value="" disabled>Select Category</option>
                {['Copier','Plotter','Smartboard','Copier + Plotter','CCTV','Shredder'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Existing Vendor</label>
              <input type="text" list="edit-existing-vendor-list" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.existingVendor || ''} onChange={e => setFormRecord({ ...formRecord, existingVendor: e.target.value })} autoComplete="off" />
              <datalist id="edit-existing-vendor-list">
                {existingVendors.map(v => <option key={v} value={v} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Existing Brand</label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500" value={formRecord.existingBrand || ''} onChange={e => setFormRecord({ ...formRecord, existingBrand: e.target.value })}>
                <option value="" disabled>Select Brand</option>
                {['Canon','HP','Sharp','Fuji','Konica Minolta','Toshiba','Ricoh'].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Existing Qty</label>
              <input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.existingQuantity ?? ''} onChange={e => setFormRecord({ ...formRecord, existingQuantity: e.target.value ? parseInt(e.target.value) : null })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contract Duration (Mths)</label>
              <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.contractDuration || ''} onChange={e => setFormRecord({ ...formRecord, contractDuration: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contract End Date</label>
              <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.contractEndDate || ''} onChange={e => setFormRecord({ ...formRecord, contractEndDate: e.target.value })} />
            </div>

            {/* 3. Planning & Requirements */}
            <div className="sm:col-span-3 border-b border-slate-100 pt-2 pb-1">
              <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">3. Planning & Requirements</span>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Actual Open Date</label>
              <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.tenderOpenDate || ''} onChange={e => setFormRecord({ ...formRecord, tenderOpenDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Budget (RM)</label>
              <input type="number" step="0.01" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.budget || ''} onChange={e => setFormRecord({ ...formRecord, budget: e.target.value ? parseFloat(e.target.value) : null })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-rose-600 mb-1">Expected Open Date <span className="text-rose-500">*</span></label>
              <input required type="date" className="w-full px-3 py-2 border border-rose-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-400 bg-rose-50/40" value={formRecord.expectedTenderOpenDate || ''} onChange={e => setFormRecord({ ...formRecord, expectedTenderOpenDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contract End Date (Next)</label>
              <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.contractEndDateNext || ''} onChange={e => setFormRecord({ ...formRecord, contractEndDateNext: e.target.value })} />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">Specs Requirement</label>
              <textarea rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.specsRequirement || ''} onChange={e => setFormRecord({ ...formRecord, specsRequirement: e.target.value })} />
            </div>

            {/* 4. Submission Info */}
            <div className="sm:col-span-3 border-b border-slate-100 pt-2 pb-1">
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">4. Submission Info</span>
            </div>
            <div className="sm:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col justify-between">
                <label className="block text-xs font-bold text-slate-700 mb-1">Company Name</label>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-2.5 min-h-[42px] bg-slate-50/80 rounded-lg border border-slate-200/80">
                  {COMPANY_OPTIONS.map(item => (
                    <label key={item} className="inline-flex items-center space-x-1.5 cursor-pointer text-sm text-slate-700 hover:text-slate-900">
                      <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={isValueSelected('companyName', item)} onChange={() => toggleMultiValue('companyName', item)} />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-between">
                <label className="block text-xs font-bold text-slate-700 mb-1">Proposed Brand</label>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-2.5 min-h-[42px] bg-slate-50/80 rounded-lg border border-slate-200/80">
                  {BRAND_OPTIONS.map(item => (
                    <label key={item} className="inline-flex items-center space-x-1.5 cursor-pointer text-sm text-slate-700 hover:text-slate-900">
                      <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={isValueSelected('proposedBrand', item)} onChange={() => toggleMultiValue('proposedBrand', item)} />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="sm:col-span-3">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">Remark (Submission Price)</label>
                <span className="text-[11px] text-slate-400">Sample: <span className="text-slate-500 font-medium">ASN - RM xxx, ATP - RM xxx</span></span>
              </div>
              <textarea rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-300" placeholder="ASN - RM xxx, ATP - RM xxx" value={formRecord.remarkSubmissionprice || ''} onChange={e => setFormRecord({ ...formRecord, remarkSubmissionprice: e.target.value })} />
            </div>

            {/* 5. Result Details */}
            <div className="sm:col-span-3 border-b border-slate-100 pt-2 pb-1">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">5. Result Details</span>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Result Status</label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.resultStatus || 'Pending'} onChange={e => setFormRecord({ ...formRecord, resultStatus: e.target.value })}>
                <option value="Pending">Pending</option>
                <option value="Win">Win</option>
                <option value="Lose">Lose</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Awarded Vendor</label>
              <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.awardedVendor || ''} onChange={e => setFormRecord({ ...formRecord, awardedVendor: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Awarded Brand</label>
              <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.awardedBrand || ''} onChange={e => setFormRecord({ ...formRecord, awardedBrand: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Awarded Amount (RM)</label>
              <input type="number" step="0.01" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.awardedAmount || ''} onChange={e => setFormRecord({ ...formRecord, awardedAmount: e.target.value ? parseFloat(e.target.value) : null })} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Remark</label>
              <textarea rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.updateRemark || ''} onChange={e => setFormRecord({ ...formRecord, updateRemark: e.target.value })} />
            </div>
          </div>

          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition">Cancel</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   TenderTable — now clickable: clicking a row opens EditTenderModal.
   ============================================================ */

export function TenderTable({ rows, onDataChanged }: { rows: TenderRow[]; onDataChanged?: () => void }) {
  const [editingRow, setEditingRow] = useState<TenderRow | null>(null);

  if (!rows.length) {
    return <div className="rounded-md border border-dashed border-[#DEE3E2] py-10 text-center text-[13px] text-[#8B9895]">No records match this selection.</div>;
  }
  return (
    <>
      <div className="overflow-x-auto rounded-md border border-[#E4E7E6]">
        <table className="w-full min-w-[860px] text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-[#E4E7E6] bg-[#F7F8F7] text-[10.5px] uppercase tracking-[0.06em] text-[#7C8A87]">
              <th className="px-3 py-2 font-semibold">End User</th>
              <th className="px-3 py-2 font-semibold">Marketing</th>
              <th className="px-3 py-2 font-semibold">Sales</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Expected Open</th>
              <th className="px-6 py-2 text-right font-semibold">Awarded Amount</th>
              <th className="px-3 py-2 font-semibold">Awarded Vendor</th>
              <th className="px-3 py-2 font-semibold">Awarded Brand</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                onClick={() => setEditingRow(r)}
                title="Click to edit this tender"
                className="cursor-pointer border-b border-[#EEF1F0] last:border-0 hover:bg-[#F0F7F5] transition"
              >
                <td className="max-w-[260px] truncate px-3 py-2 text-[#3E4E4B]" title={r.endUser ?? undefined}>{r.endUser ?? "—"}</td>
                <td className="px-3 py-2 text-[#3E4E4B]">{r.marketing ?? "—"}</td>
                <td className="px-3 py-2 text-[#3E4E4B]">{r.sales ?? "—"}</td>
                <td className="px-3 py-2"><StatusPill status={r.resultStatus} /></td>
                <td className="px-3 py-2 text-[#3E4E4B]">{formatDate(r.expectedTenderOpenDate)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-[#3E4E4B]">{fmtMYR(r.awardedAmount)}</td>
                <td className="max-w-[260px] truncate px-3 py-2 text-[#3E4E4B]" title={r.awardedVendor ?? undefined}>
                  {r.awardedVendor ?? "—"}
                </td>
                <td className="px-3 py-2 text-[#3E4E4B]">{r.awardedBrand ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingRow && (
        <EditTenderModal
          row={editingRow}
          onClose={() => setEditingRow(null)}
          onSaved={() => {
            onDataChanged?.();
          }}
        />
      )}
    </>
  );
}

export function Drawer({
  title,
  rows,
  onClose,
  onDataChanged,
}: {
  title: string;
  rows: TenderRow[];
  onClose: () => void;
  onDataChanged?: () => void; // 🆕 bubble up so the dashboard can refetch after an edit
}) {
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
          <div className="mb-3 text-[12.5px] text-[#7C8A87]">
            {rows.length} tender{rows.length !== 1 ? "s" : ""} · click a row to edit
          </div>
          <TenderTable rows={rows} onDataChanged={onDataChanged} />
        </div>
      </div>
    </div>
  );
}

export const BAR_STYLE = { fontSize: 11.5, fill: "#5C6D6A" };