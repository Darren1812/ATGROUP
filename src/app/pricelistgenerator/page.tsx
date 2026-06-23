'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import LFPGenerator from './maincomponent/LFPGenerator'; // ← adjust path if needed

interface CopierModel {
  id: number;
  modelName: string;
  brand: string;
  category: string;
  basicPrice: number;
  price60Months: number;
  price36Months: number;
  type: string;
}

interface EquipmentSpec {
  id: number;
  specName: string;
  category: string;
  basicPrice: number;
  price60Months: number;
  price36Months: number;
}

interface ExclusionRule {
  id: number;
  equipmentIdA: number;
  equipmentIdB: number;
  ruleType: string;
  modelId: number | null;
}

interface PackedCopierData {
  model: CopierModel;
  equipments: EquipmentSpec[];
  rules: ExclusionRule[];
}

function groupByCategory(specs: EquipmentSpec[]): Record<string, EquipmentSpec[]> {
  return specs.reduce((acc, spec) => {
    const key = spec.category || 'Others';
    if (!acc[key]) acc[key] = [];
    acc[key].push(spec);
    return acc;
  }, {} as Record<string, EquipmentSpec[]>);
}

const CAT_STYLE: Record<string, { dot: string; badge: string }> = {
  Finisher:       { dot: 'bg-violet-400', badge: 'bg-violet-50 text-violet-600' },
  'Paper Feeder': { dot: 'bg-sky-400',    badge: 'bg-sky-50 text-sky-600' },
  'Card Reader':  { dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-600' },
  Software:       { dot: 'bg-emerald-400',badge: 'bg-emerald-50 text-emerald-700' },
  Others:         { dot: 'bg-slate-400',  badge: 'bg-slate-100 text-slate-500' },
};

export default function PriceListGeneratorPage() {
  const router  = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  const [selectedBrand,    setSelectedBrand]    = useState('Canon');
  const [selectedCategory, setSelectedCategory] = useState('MFP');
  const [selectedType,     setSelectedType]     = useState('A4 Desktop Series');
  const [fetchedData,      setFetchedData]      = useState<PackedCopierData[]>([]);
  const [loading,          setLoading]          = useState(false);
  const [activeModelIdx,   setActiveModelIdx]   = useState<number>(0);
  const [selectedSpecIds,  setSelectedSpecIds]  = useState<number[]>([]);
  const [modelDropOpen,    setModelDropOpen]    = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const isLFP = selectedCategory === 'LFP';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setModelDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setSelectedType(selectedBrand === 'Canon' ? 'A4 Desktop Series' : 'Light Duty Series');
  }, [selectedBrand]);

  useEffect(() => {
    if (isLFP) return;
    setLoading(true);
    setSelectedSpecIds([]);
    setActiveModelIdx(0);
    setModelDropOpen(false);
    fetch(`${baseUrl}/api/Copier/generator-data?brand=${selectedBrand}&category=${selectedCategory}&type=${encodeURIComponent(selectedType)}`)
      .then(res => res.json())
      .then(data => { setFetchedData(data); setLoading(false); })
      .catch(err  => { console.error(err); setLoading(false); });
  }, [selectedBrand, selectedCategory, selectedType, isLFP, baseUrl]);

  const currentPack = fetchedData[activeModelIdx];

  const handleSpecToggle = (specId: number) =>
    setSelectedSpecIds(prev => prev.includes(specId) ? prev.filter(id => id !== specId) : [...prev, specId]);

  const isSpecDisabled = (specId: number) => {
    if (selectedSpecIds.includes(specId) || !currentPack) return false;
    for (const rule of currentPack.rules) {
      const isA = rule.equipmentIdA === specId;
      const isB = rule.equipmentIdB === specId;
      if (isA || isB) {
        const targetId = isA ? rule.equipmentIdB : rule.equipmentIdA;
        if (selectedSpecIds.includes(targetId)) return true;
      }
    }
    return false;
  };

  const calculateTotals = () => {
    if (!currentPack) return { outright: 0, lease36: 0, lease60: 0 };
    let outright = currentPack.model.basicPrice;
    let lease36  = currentPack.model.price36Months;
    let lease60  = currentPack.model.price60Months;
    currentPack.equipments.forEach(spec => {
      if (selectedSpecIds.includes(spec.id)) {
        outright += spec.basicPrice    || 0;
        lease36  += spec.price36Months || 0;
        lease60  += spec.price60Months || 0;
      }
    });
    return { outright, lease36, lease60 };
  };

  const totals        = calculateTotals();
  const selectedCount = selectedSpecIds.length;
  const fmt = (n: number) => n.toLocaleString('en-MY', { minimumFractionDigits: 2 });
  const [specsOpen, setSpecsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans">

      {/* Sub-header */}
      <div className="bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLFP ? 'bg-emerald-50' : 'bg-blue-50'}`}>
            <svg className={`w-4 h-4 ${isLFP ? 'text-emerald-600' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-3M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M9 7h6"/>
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 leading-tight">Price List Generator</h1>
            <p className="text-[11px] text-slate-400 leading-tight">
              {isLFP ? 'Large Format Printer — hardware & consumables quotation' : 'Configure options and generate real-time quotations'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isLFP && (
            <>
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Brand</label>
                <select value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)}
                  className="text-sm font-semibold text-slate-700 bg-slate-100 border-0 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-400 focus:outline-none">
                  <option value="Canon">Canon</option>
                  <option value="KM">KM (Konica Minolta)</option>
                </select>
              </div>
              <div className="w-px h-4 bg-slate-200"/>
            </>
          )}

          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Category</label>
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
              className={`text-sm font-semibold border-0 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 ${isLFP ? 'bg-emerald-100 text-emerald-700 focus:ring-emerald-400' : 'bg-slate-100 text-slate-700 focus:ring-blue-400'}`}>
              <option value="MFP">MFP</option>
              <option value="IFP">IFP</option>
              <option value="LFP">LFP</option>
            </select>
          </div>

          {!isLFP && (
            <>
              <div className="w-px h-4 bg-slate-200"/>
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Type</label>
                <select value={selectedType} onChange={e => setSelectedType(e.target.value)}
                  className="text-sm font-semibold text-slate-700 bg-slate-100 border-0 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-400 focus:outline-none">
                  {selectedBrand === 'Canon' ? (
                    <><option value="A4 Desktop Series">A4 Desktop Series</option><option value="A3 Desktop Series">A3 Desktop Series</option><option value="A3 Light Duty Series">A3 Light Duty Series</option></>
                  ) : (
                    <><option value="Light Duty Series">Light Duty Series</option><option value="Mid-Heavy Duty Series">Mid-Heavy Duty Series</option><option value="Light Production Series">Light Production Series</option></>
                  )}
                </select>
              </div>
            </>
          )}

          {isLFP && (
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
              PlotterHardware
            </span>
          )}
        </div>
      </div>

      <div className="px-8 py-5 max-w-7xl mx-auto space-y-4">

            <div className="grid grid-cols-2 gap-3">
 
              {/* ── Card 1: Create New Device ─────────────────────── */}
              <button
                onClick={() => router.push('/pricelistgenerator/manage/adddevice')}
                className="group flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-left hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800">Create New Device</p>
                  <p className="text-xs text-slate-400">Add MFP, IFP or LFP models and pricing</p>
                </div>
                <svg className="w-4 h-4 text-slate-300 group-hover:text-blue-400 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
              {/* ── Card 2: Optional Specs & Rules ───────────────── */}
              <div className="relative">
                  {/* Collapsed state */}
                {!specsOpen && (
                  <button
                    onClick={() => setSpecsOpen(true)}
                    className="group w-full flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-left hover:border-orange-300 hover:shadow-sm transition-all"
                  >
                    <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center group-hover:bg-orange-500 transition-colors flex-shrink-0">
                      <svg className="w-4 h-4 text-orange-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800">Optional Specs &amp; Rules</p>
                      <p className="text-xs text-slate-400">Finishers, Paper Feeders, hardware catalog</p>
                    </div>
                    <svg className="w-4 h-4 text-slate-300 group-hover:text-orange-400 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                )}
                {/* Expanded state */}
                {specsOpen && (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    {/* Expanded header — click to collapse */}
                    <button
                      onClick={() => setSpecsOpen(false)}
                      className="group w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 border-b border-slate-200 transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-slate-600 flex-1">Optional Specs &amp; Rules</span>
                      {/* Chevron up = close hint */}
                      <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/>
                      </svg>
                    </button>
                    {/* Two sub-options side by side */}
                    <div className="grid grid-cols-2 divide-x divide-slate-100">
                      {/* MFP Spec List */}
                      <button
                        onClick={() => router.push('/pricelistgenerator/manage/speclist')}
                        className="group flex flex-col gap-1 px-4 py-3.5 text-left hover:bg-orange-50 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className="w-6 h-6 rounded-md bg-orange-100 group-hover:bg-orange-500 flex items-center justify-center flex-shrink-0 transition-colors">
                            <svg className="w-3 h-3 text-orange-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                            </svg>
                          </div>
                          <span className="text-xs font-bold text-slate-700 group-hover:text-orange-700 transition-colors">MFP Spec List</span>
                        </div>
                        <span className="text-[10px] text-slate-400 group-hover:text-orange-400 transition-colors pl-8">
                          Finishers &amp; Feeders
                        </span>
                      </button>
                      {/* LFP Consumables */}
                      <button
                        onClick={() => router.push('/pricelistgenerator/manage/speclist/LFPCons')}
                        className="group flex flex-col gap-1 px-4 py-3.5 text-left hover:bg-emerald-50 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className="w-6 h-6 rounded-md bg-emerald-100 group-hover:bg-emerald-500 flex items-center justify-center flex-shrink-0 transition-colors">
                            <svg className="w-3 h-3 text-emerald-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                            </svg>
                          </div>
                          <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">LFP Consumables</span>
                        </div>
                        <span className="text-[10px] text-slate-400 group-hover:text-emerald-500 transition-colors pl-8">
                          Ink Tanks &amp; Media
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

        {/* LFP view */}
        {isLFP && <LFPGenerator baseUrl={baseUrl} />}

        {/* MFP / IFP view */}
        {!isLFP && (
          <>
            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
                <svg className="w-7 h-7 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <span className="text-sm">Loading configurations…</span>
              </div>
            ) : fetchedData.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center py-24 gap-2 text-slate-400">
                <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p className="text-sm font-medium">No models found for {selectedBrand} · {selectedCategory}</p>
                <p className="text-xs">Try a different brand or category.</p>
              </div>
            ) : (
              <>
                {/* Quotation Summary Bar */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 flex items-center">
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      <span className="text-xs font-semibold text-blue-100 uppercase tracking-widest">Quotation Summary</span>
                      {currentPack && <span className="text-xs font-bold text-white opacity-80">— {currentPack.model.modelName}</span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-slate-100">
                    <div className="px-6 py-4 flex items-center gap-4">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Outright Purchase</p>
                        <p className="text-xl font-bold text-blue-600 tabular-nums leading-none">RM {fmt(totals.outright)}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">One-time payment</p>
                      </div>
                    </div>
                    <div className="px-6 py-4 flex items-center gap-4 bg-amber-50/30">
                      <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-widest mb-0.5">36-Month Rental</p>
                        <div className="flex items-baseline gap-1">
                          <p className="text-xl font-bold text-amber-600 tabular-nums leading-none">RM {fmt(totals.lease36)}</p>
                          <span className="text-xs text-amber-400 font-medium">/mo</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">Monthly repayment · 36 instalments</p>
                      </div>
                    </div>
                    <div className="px-6 py-4 flex items-center gap-4 bg-emerald-50/30">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest mb-0.5">60-Month Rental</p>
                        <div className="flex items-baseline gap-1">
                          <p className="text-xl font-bold text-emerald-600 tabular-nums leading-none">RM {fmt(totals.lease60)}</p>
                          <span className="text-xs text-emerald-400 font-medium">/mo</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">Monthly repayment · 60 instalments</p>
                      </div>
                    </div>
                  </div>
                  {selectedCount > 0 && currentPack && (
                    <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-3 flex flex-wrap gap-2 items-center">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mr-1">Included:</span>
                      {currentPack.equipments.filter(s => selectedSpecIds.includes(s.id)).map(spec => (
                        <span key={spec.id} className="inline-flex items-center gap-1 text-[11px] font-medium bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                          <span className={`w-1.5 h-1.5 rounded-full ${CAT_STYLE[spec.category]?.dot ?? 'bg-slate-400'}`}/>
                          {spec.specName}
                          <button onClick={() => handleSpecToggle(spec.id)} className="ml-0.5 text-slate-300 hover:text-red-400 transition-colors leading-none">✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Configurator */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-xl border border-slate-200 overflow-visible">
                      <div className="px-5 py-3.5 border-b border-slate-100">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Copier Model</p>
                      </div>
                      <div className="p-4" ref={dropRef}>
                        <div className="relative">
                          <button onClick={() => setModelDropOpen(o => !o)}
                            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border text-left transition-all ${modelDropOpen ? 'border-blue-400 ring-2 ring-blue-100 bg-white' : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'}`}>
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0">
                                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{currentPack?.model.modelName ?? 'Select a model'}</p>
                                {currentPack && <p className="text-[11px] text-slate-400">{currentPack.model.brand} · {currentPack.model.category}</p>}
                              </div>
                            </div>
                            <svg className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${modelDropOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                          </button>
                          {modelDropOpen && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden">
                              <div className="py-1 max-h-64 overflow-y-auto">
                                {fetchedData.map((pack, idx) => (
                                  <button key={pack.model.id} onClick={() => { setActiveModelIdx(idx); setSelectedSpecIds([]); setModelDropOpen(false); }}
                                    className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors ${activeModelIdx === idx ? 'bg-blue-50' : ''}`}>
                                    <div className="flex items-center gap-3 min-w-0">
                                      {activeModelIdx === idx
                                        ? <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0"><svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></div>
                                        : <div className="w-5 h-5 rounded-full border-2 border-slate-200 flex-shrink-0"/>
                                      }
                                      <span className={`text-sm font-semibold truncate ${activeModelIdx === idx ? 'text-blue-700' : 'text-slate-700'}`}>{pack.model.modelName}</span>
                                    </div>
                                    <span className="text-xs tabular-nums text-slate-400 flex-shrink-0 ml-4">RM {fmt(pack.model.basicPrice)}</span>
                                  </button>
                                ))}
                              </div>
                              <div className="border-t border-slate-100 px-4 py-2 bg-slate-50/70">
                                <p className="text-[10px] text-slate-400">{fetchedData.length} models for {selectedBrand} · {selectedCategory}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {currentPack && (
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-100">
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Base Unit Pricing</p>
                        </div>
                        <div className="divide-y divide-slate-100">
                          <div className="flex items-center justify-between px-5 py-3.5">
                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"/><span className="text-xs font-semibold text-slate-600">Outright Purchase</span></div>
                            <span className="text-sm font-bold text-blue-600 tabular-nums">RM {fmt(currentPack.model.basicPrice)}</span>
                          </div>
                          <div className="flex items-center justify-between px-5 py-3.5">
                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400"/><span className="text-xs font-semibold text-slate-600">36-Month Rental</span></div>
                            <span className="text-sm font-bold text-amber-500 tabular-nums">RM {fmt(currentPack.model.price36Months)}<span className="text-[10px] text-slate-400 font-normal">/mo</span></span>
                          </div>
                          <div className="flex items-center justify-between px-5 py-3.5">
                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400"/><span className="text-xs font-semibold text-slate-600">60-Month Rental</span></div>
                            <span className="text-sm font-bold text-emerald-600 tabular-nums">RM {fmt(currentPack.model.price60Months)}<span className="text-[10px] text-slate-400 font-normal">/mo</span></span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {currentPack && (
                    <div className="lg:col-span-3">
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        {currentPack.equipments.length === 0 ? (
                          <div className="py-14 text-center text-slate-400"><p className="text-sm">No optional specs mapped to this model.</p></div>
                        ) : (
                          <div>
                            {Object.entries(groupByCategory(currentPack.equipments)).map(([catName, specs]) => (
                              <div key={catName}>
                                <div className="px-5 py-2 bg-slate-50 flex items-center gap-2 border-b border-slate-100">
                                  <span className={`w-1.5 h-1.5 rounded-full ${CAT_STYLE[catName]?.dot ?? 'bg-slate-400'}`}/>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{catName}</span>
                                  <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded ${CAT_STYLE[catName]?.badge ?? 'bg-slate-100 text-slate-400'}`}>{specs.length}</span>
                                </div>
                                {specs.map(spec => {
                                  const disabled = isSpecDisabled(spec.id);
                                  const checked  = selectedSpecIds.includes(spec.id);
                                  return (
                                    <label key={spec.id}
                                      className={`flex items-center gap-4 px-5 py-3.5 border-b border-slate-50 last:border-0 transition-colors ${checked ? 'bg-blue-50/50 cursor-pointer' : disabled ? 'opacity-40 cursor-not-allowed bg-slate-50/50' : 'hover:bg-slate-50 cursor-pointer'}`}>
                                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked ? 'bg-blue-600 border-blue-600' : disabled ? 'border-slate-200 bg-slate-100' : 'border-slate-300 hover:border-blue-400'}`}>
                                        <input type="checkbox" checked={checked} disabled={disabled} onChange={() => handleSpecToggle(spec.id)} className="sr-only"/>
                                        {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-semibold truncate ${checked ? 'text-blue-700' : disabled ? 'text-slate-400' : 'text-slate-800'}`}>{spec.specName}</p>
                                        {disabled && <p className="text-[11px] text-red-400 font-medium mt-0.5">Conflict with a selected item</p>}
                                      </div>
                                      <div className="hidden sm:flex items-center gap-5 flex-shrink-0">
                                        <div className="text-right w-24"><p className="text-[10px] text-slate-400 mb-0.5">Purchase</p><p className={`text-xs font-semibold tabular-nums ${checked ? 'text-blue-600' : 'text-slate-600'}`}>{spec.basicPrice > 0 ? `+RM ${fmt(spec.basicPrice)}` : '—'}</p></div>
                                        <div className="text-right w-20"><p className="text-[10px] text-amber-400 mb-0.5">36 mo</p><p className={`text-xs font-semibold tabular-nums ${checked ? 'text-amber-500' : 'text-slate-500'}`}>{spec.price36Months > 0 ? `+RM ${fmt(spec.price36Months)}` : '—'}</p></div>
                                        <div className="text-right w-20"><p className="text-[10px] text-emerald-400 mb-0.5">60 mo</p><p className={`text-xs font-semibold tabular-nums ${checked ? 'text-emerald-600' : 'text-slate-500'}`}>{spec.price60Months > 0 ? `+RM ${fmt(spec.price60Months)}` : '—'}</p></div>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                          <p className="text-[10px] text-slate-400">{currentPack.equipments.length} specs available · {currentPack.rules.length} conflict rules active</p>
                          <p className="text-[10px] text-slate-400">Prices sync live from central DB</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}