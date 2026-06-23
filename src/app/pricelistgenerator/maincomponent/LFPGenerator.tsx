'use client';

import { useEffect, useMemo, useState } from 'react';

// ─── Types (已根据后端实际返回的 JSON 结构修正) ───────────────────────────

interface PlotterConsumable {
  id: number;
  consType: string;       // 后端对应的字段 (原 consumableType)
  productName: string;    // 后端对应的字段 (原 consumableName)
  mercuryCode: string;    // 后端对应的字段 (原 consumableCode)
  listPrice: number;      // 后端对应的字段 (原 marketPrice)
  netPrice?: number;      // 后端 JSON 中没有，这里设为可选并在计算时做 fallback
  hardwares?: any[];
}

interface PlotterHardwareWithConsumables {
  id: number;
  productType: string;
  productName: string;
  productCode: string;
  netPrice: number;
  marketPrice: number;
  warranty?: string;
  remark?: string;
  consumables: PlotterConsumable[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n?.toLocaleString('en-MY', { minimumFractionDigits: 2 }) ?? '0.00';

const PRODUCT_TYPE_STYLE: Record<string, { dot: string; badge: string }> = {
  'Technical':  { dot: 'bg-blue-400',    badge: 'bg-blue-50 text-blue-600 border-blue-100' },
  'Graphic':    { dot: 'bg-violet-400',  badge: 'bg-violet-50 text-violet-600 border-violet-100' },
  'Photo':      { dot: 'bg-pink-400',    badge: 'bg-pink-50 text-pink-600 border-pink-100' },
  'Production': { dot: 'bg-orange-400',  badge: 'bg-orange-50 text-orange-600 border-orange-100' },
  // 如果你的产品类型直接返回 "TC SERIES"，这里加一个兼容样式
  'TC SERIES':  { dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
};

// 这里的 Key 需要跟后端的 consType 保持一致
const CONSUMABLE_TYPE_STYLE: Record<string, string> = {
  'Ink':                   'bg-sky-50 text-sky-600 border-sky-100',
  'Media':                 'bg-emerald-50 text-emerald-600 border-emerald-100',
  'Maintenance':           'bg-amber-50 text-amber-600 border-amber-100',
  'Maintenance Cartridge': 'bg-amber-50 text-amber-600 border-amber-100',
  'TC series 70ml':        'bg-indigo-50 text-indigo-600 border-indigo-100',
  'Others':                'bg-slate-50 text-slate-500 border-slate-200',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function LFPGenerator({ baseUrl }: { baseUrl: string }) {
  const [data,              setData]              = useState<PlotterHardwareWithConsumables[]>([]);
  const [loading,           setLoading]           = useState(true);
  const [activeHardwareIdx, setActiveHardwareIdx] = useState(0);
  const [hardwareDropOpen,  setHardwareDropOpen]  = useState(false);
  const [selectedConsIds,   setSelectedConsIds]   = useState<number[]>([]);

  // ── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    fetch(`${baseUrl}/api/PlotterHardware/WithConsumables`)
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [baseUrl]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-lfp-drop]')) setHardwareDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const current = data[activeHardwareIdx];

  const toggleCons = (id: number) =>
    setSelectedConsIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const selectedConsumables = current?.consumables.filter(c => selectedConsIds.includes(c.id)) ?? [];

  // 计算总成本价（耗材若无 netPrice 则当 0 计算）
  const totalNet    = (current?.netPrice    ?? 0) + selectedConsumables.reduce((s, c) => s + (c.netPrice    ?? 0), 0);
  // 计算总销售价（耗材使用后端的 listPrice）
  const totalMarket = (current?.marketPrice ?? 0) + selectedConsumables.reduce((s, c) => s + (c.listPrice   ?? 0), 0);
  const margin      = totalMarket - totalNet;
  const [hardwareSearch, setHardwareSearch] = useState('');
  
  const filteredHardware = useMemo(() => {
    const keyword = hardwareSearch.toLowerCase().trim();

    if (!keyword) return data;

    return data.filter(item =>
      item.productName?.toLowerCase().includes(keyword) ||
      item.productCode?.toLowerCase().includes(keyword) ||
      item.productType?.toLowerCase().includes(keyword)
    );
  }, [data, hardwareSearch]);
  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
        <svg className="w-7 h-7 animate-spin text-emerald-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <span className="text-sm">Loading LFP products…</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center py-24 gap-2 text-slate-400">
        <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p className="text-sm font-medium">No LFP products found</p>
        <p className="text-xs">Add products via the LFP configuration page.</p>
      </div>
    );
  }

  const typeStyle = PRODUCT_TYPE_STYLE[current?.productType] ?? { dot: 'bg-slate-400', badge: 'bg-slate-50 text-slate-500 border-slate-200' };

  return (
    <div className="space-y-4">

      {/* ── Quotation Summary Bar ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span className="text-xs font-semibold text-emerald-100 uppercase tracking-widest">LFP Quotation Summary</span>
            {current && (
              <span className="text-xs font-bold text-white opacity-80">— {current.productName}</span>
            )}
          </div>
          {current?.productType && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeStyle.badge}`}>
              {current.productType}
            </span>
          )}
        </div>

        {/* Price columns: Net + Market + Margin */}
        <div className="grid grid-cols-3 divide-x divide-slate-100">
          {/* Net Price */}
          <div className="px-6 py-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Net Price</p>
              <p className="text-xl font-bold text-blue-600 tabular-nums leading-none">RM {fmt(totalNet)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Dealer / cost price</p>
            </div>
          </div>

          {/* Market Price */}
          <div className="px-6 py-4 flex items-center gap-4 bg-emerald-50/30">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest mb-0.5">Market Price</p>
              <p className="text-xl font-bold text-emerald-600 tabular-nums leading-none">RM {fmt(totalMarket)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Customer selling price</p>
            </div>
          </div>

          {/* Margin */}
          <div className="px-6 py-4 flex items-center gap-4 bg-slate-50/40">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Gross Margin</p>
              <p className={`text-xl font-bold tabular-nums leading-none ${margin >= 0 ? 'text-slate-700' : 'text-red-500'}`}>
                {margin >= 0 ? '+' : ''}RM {fmt(Math.abs(margin))}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {totalMarket > 0 ? `${((margin / totalMarket) * 100).toFixed(1)}% of market price` : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Selected consumables strip */}
        {selectedConsIds.length > 0 && current && (
          <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-3 flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mr-1">Included:</span>
            {selectedConsumables.map(c => (
              <span key={c.id}
                className="inline-flex items-center gap-1 text-[11px] font-medium bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"/>
                {c.productName} {/* 已修正：将 c.consumableName 改为 c.productName */}
                <button onClick={() => toggleCons(c.id)}
                  className="ml-0.5 text-slate-300 hover:text-red-400 transition-colors leading-none">✕</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Configurator ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">

        {/* Left: Hardware picker + base info */}
        <div className="lg:col-span-2 space-y-4">

          {/* Hardware Dropdown */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-visible">
            <div className="px-5 py-3.5 border-b border-slate-100">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                Large Format Printer
              </p>
            </div>

            <div className="p-4" data-lfp-drop>
              <div className="relative">

                <button
                  onClick={() => setHardwareDropOpen(o => !o)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
                    hardwareDropOpen
                      ? 'border-emerald-400 ring-2 ring-emerald-100 bg-white'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-3.5 h-3.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                        />
                      </svg>
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {current?.productName ?? 'Select a product'}
                      </p>

                      {current && (
                        <p className="text-[11px] text-slate-400">
                          {current.productCode} · {current.productType}
                        </p>
                      )}
                    </div>
                  </div>

                  <svg
                    className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${
                      hardwareDropOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {hardwareDropOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden">

                    {/* Search Bar */}
                    <div className="p-3 border-b border-slate-100">
                      <div className="relative">

                        <svg
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>

                        <input
                          type="text"
                          value={hardwareSearch}
                          onChange={(e) => setHardwareSearch(e.target.value)}
                          placeholder="Search printer..."
                          className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400"
                        />
                      </div>
                    </div>

                    {/* Result List */}
                    <div className="max-h-64 overflow-y-auto">

                      {filteredHardware.length === 0 && (
                        <div className="px-4 py-8 text-center">
                          <p className="text-sm text-slate-400">
                            No printer found
                          </p>
                        </div>
                      )}

                      {filteredHardware.map((item) => {

                        const originalIdx = data.findIndex(
                          d => d.id === item.id
                        );

                        const ts =
                          PRODUCT_TYPE_STYLE[item.productType] ??
                          {
                            dot: 'bg-slate-400',
                            badge: '',
                          };

                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveHardwareIdx(originalIdx);
                              setSelectedConsIds([]);
                              setHardwareDropOpen(false);
                              setHardwareSearch('');
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors ${
                              activeHardwareIdx === originalIdx
                                ? 'bg-emerald-50'
                                : ''
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">

                              {activeHardwareIdx === originalIdx ? (
                                <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                                  <svg
                                    className="w-2.5 h-2.5 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={3}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-slate-200 flex-shrink-0" />
                              )}

                              <div className="min-w-0">
                                <p
                                  className={`text-sm font-semibold truncate ${
                                    activeHardwareIdx === originalIdx
                                      ? 'text-emerald-700'
                                      : 'text-slate-700'
                                  }`}
                                >
                                  {item.productName}
                                </p>

                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${ts.dot}`}
                                  />
                                  <span className="text-[10px] text-slate-400">
                                    {item.productType}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <span className="text-xs tabular-nums text-slate-400 flex-shrink-0 ml-4">
                              RM {fmt(item.marketPrice)}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="border-t border-slate-100 px-4 py-2 bg-slate-50/70">
                      <p className="text-[10px] text-slate-400">
                        {filteredHardware.length} of {data.length} LFP products
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Base unit pricing */}
          {current && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Base Unit Pricing</p>
                {current.productType && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeStyle.badge}`}>
                    {current.productType}
                  </span>
                )}
              </div>
              <div className="divide-y divide-slate-100">
                <div className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"/>
                    <span className="text-xs font-semibold text-slate-600">Net Price</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600 tabular-nums">RM {fmt(current.netPrice)}</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"/>
                    <span className="text-xs font-semibold text-slate-600">Market Price</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 tabular-nums">RM {fmt(current.marketPrice)}</span>
                </div>
                {current.warranty && (
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-300"/>
                      <span className="text-xs font-semibold text-slate-600">Warranty</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{current.warranty}</span>
                  </div>
                )}
                {current.productCode && (
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-300"/>
                      <span className="text-xs font-semibold text-slate-600">Product Code</span>
                    </div>
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{current.productCode}</span>
                  </div>
                )}
                {current.remark && (
                  <div className="px-5 py-3.5">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Remark</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{current.remark}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Consumables picker */}
        {current && (
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Compatible Consumables</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">Select add-ons to include in the quote</p>
                </div>
                {selectedConsIds.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">
                      {selectedConsIds.length} selected
                    </span>
                    <button onClick={() => setSelectedConsIds([])}
                      className="text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors">
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {current.consumables.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                    </svg>
                  </div>
                  <p className="text-sm font-medium">No consumables mapped to this product</p>
                  <p className="text-xs mt-0.5">Link consumables via the LFP Consumables manager.</p>
                </div>
              ) : (
                <>
                  {/* Group by consumable type */}
                  {(() => {
                    const grouped = current.consumables.reduce((acc, c) => {
                      const key = c.consType || 'Others'; // 已修正：原 c.consumableType 改为 c.consType
                      if (!acc[key]) acc[key] = [];
                      acc[key].push(c);
                      return acc;
                    }, {} as Record<string, PlotterConsumable[]>);

                    return Object.entries(grouped).map(([typeName, cons]) => (
                      <div key={typeName}>
                        {/* Category header */}
                        <div className="px-5 py-2 bg-slate-50 flex items-center gap-2 border-b border-slate-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"/>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{typeName}</span>
                          <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-emerald-50 text-emerald-600 border-emerald-100">
                            {cons.length}
                          </span>
                        </div>

                        {cons.map(c => {
                          const checked = selectedConsIds.includes(c.id);
                          const badgeClass = CONSUMABLE_TYPE_STYLE[c.consType] ?? CONSUMABLE_TYPE_STYLE.Others; // 已修正：原 c.consumableType 改为 c.consType
                          return (
                            <label key={c.id}
                              className={`flex items-center gap-4 px-5 py-3.5 border-b border-slate-50 last:border-0 cursor-pointer transition-colors ${
                                checked ? 'bg-emerald-50/50' : 'hover:bg-slate-50'
                              }`}>
                              {/* Checkbox */}
                              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                checked ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300 hover:border-emerald-400'
                              }`}>
                                <input type="checkbox" checked={checked} onChange={() => toggleCons(c.id)} className="sr-only"/>
                                {checked && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                                  </svg>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className={`text-sm font-semibold truncate ${checked ? 'text-emerald-700' : 'text-slate-800'}`}>
                                    {c.productName} {/* 已修正：原 c.consumableName 改为 c.productName */}
                                  </p>
                                  {c.consType && ( // 已修正：原 c.consumableType 改为 c.consType
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${badgeClass}`}>
                                      {c.consType}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] font-mono text-slate-400 mt-0.5">{c.mercuryCode}</p> {/* 已修正：原 c.consumableCode 改为 c.mercuryCode */}
                              </div>

                              {/* Prices */}
                              <div className="hidden sm:flex items-center gap-5 flex-shrink-0">
                                <div className="text-right w-24">
                                  <p className="text-[10px] text-blue-400 mb-0.5">Net</p>
                                  <p className={`text-xs font-semibold tabular-nums ${checked ? 'text-blue-600' : 'text-slate-600'}`}>
                                    {c.netPrice && c.netPrice > 0 ? `+RM ${fmt(c.netPrice)}` : '—'}
                                  </p>
                                </div>
                                <div className="text-right w-24">
                                  <p className="text-[10px] text-emerald-400 mb-0.5">Market</p>
                                  <p className={`text-xs font-semibold tabular-nums ${checked ? 'text-emerald-600' : 'text-slate-500'}`}>
                                    {c.listPrice > 0 ? `+RM ${fmt(c.listPrice)}` : '—'} {/* 已修正：原 c.marketPrice 改为 c.listPrice */}
                                  </p>
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    ));
                  })()}

                  {/* Footer */}
                  <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <p className="text-[10px] text-slate-400">
                      {current.consumables.length} consumables available
                    </p>
                    <p className="text-[10px] text-slate-400">Prices sync live from central DB</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}