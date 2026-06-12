'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface EquipmentSpec {
  id: number;
  specName: string;
  category: string;
}

interface ExclusionRuleInput {
  equipmentIdA: number;
  equipmentIdB: number;
}

const CAT_STYLE: Record<string, { dot: string; badge: string }> = {
  Finisher:       { dot: 'bg-violet-400', badge: 'bg-violet-50 text-violet-600 border-violet-100' },
  'Paper Feeder': { dot: 'bg-sky-400',    badge: 'bg-sky-50 text-sky-600 border-sky-100' },
  'Card Reader':  { dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-600 border-amber-100' },
  Software:       { dot: 'bg-emerald-400',badge: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  Others:         { dot: 'bg-slate-400',  badge: 'bg-slate-50 text-slate-500 border-slate-200' },
};

function groupByCategory(specs: EquipmentSpec[]): Record<string, EquipmentSpec[]> {
  return specs.reduce((acc, spec) => {
    const key = spec.category || 'Others';
    if (!acc[key]) acc[key] = [];
    acc[key].push(spec);
    return acc;
  }, {} as Record<string, EquipmentSpec[]>);
}

export default function AddDevicePage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const baseUrl      = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  const editModelName = searchParams.get('edit');
  const isEditMode    = !!editModelName;

  // ── Step 1 ─────────────────────────────────────────────────
  const [modelName,     setModelName]     = useState('');
  const [brand,         setBrand]         = useState('Canon');
  const [category,      setCategory]      = useState('MFP');
  const [basicPrice,    setBasicPrice]    = useState(0);
  const [price60Months, setPrice60Months] = useState(0);
  const [price36Months, setPrice36Months] = useState(0);

  // ── Step 2 ─────────────────────────────────────────────────
  const [allEquipments,  setAllEquipments]  = useState<EquipmentSpec[]>([]);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [selectedEqIds,  setSelectedEqIds]  = useState<number[]>([]);

  // ── Step 3 ─────────────────────────────────────────────────
  const [rules, setRules] = useState<ExclusionRuleInput[]>([]);

  // ── Delete confirm ─────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [type, setType] = useState('A4 Desktop Series'); // 默认初始值
  // ── Fetch all equipment specs ──────────────────────────────
  useEffect(() => {
    fetch(`${baseUrl}/api/EquipmentSpec`)
      .then(res => res.json())
      .then(data => setAllEquipments(data))
      .catch(err => console.error('Error fetching specs:', err));
  }, [baseUrl]);
    useEffect(() => {
    if (brand === 'Canon') {
        setType('A4 Desktop Series');
    } else if (brand === 'KM') {
        setType('Light Duty Series');
    } 
    }, [brand]);
  // ── Edit mode: prefill ─────────────────────────────────────
  useEffect(() => {
    if (isEditMode && editModelName) {
      fetch(`${baseUrl}/api/Copier/config-by-name?modelName=${encodeURIComponent(editModelName)}`)
        .then(res => { if (!res.ok) throw new Error('Model not found'); return res.json(); })
        .then(data => {
          setModelName(data.model.modelName || data.model.ModelName);
          setBrand(data.model.brand || 'Canon');
          setCategory(data.model.category || 'MFP');
          setBasicPrice(data.model.basicPrice || 0);
          setPrice36Months(data.model.price36Months || 0);
          setPrice60Months(data.model.price60Months || 0);
          if (data.equipments) setSelectedEqIds(data.equipments.map((eq: any) => eq.id));
          if (data.rules) {
            setRules(data.rules
              .filter((r: any) => r.modelId !== null)
              .map((r: any) => ({ equipmentIdA: r.equipmentIdA, equipmentIdB: r.equipmentIdB })));
          }
        })
        .catch(err => alert(`Error loading data for edit: ${err.message}`));
    }
  }, [isEditMode, editModelName, baseUrl]);

  // ── Helpers ────────────────────────────────────────────────
  const filteredEquipments = allEquipments.filter(eq =>
    eq.specName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEqToggle = (id: number) => {
    if (selectedEqIds.includes(id)) {
      setSelectedEqIds(selectedEqIds.filter(item => item !== id));
      setRules(rules.filter(r => r.equipmentIdA !== id && r.equipmentIdB !== id));
    } else {
      setSelectedEqIds([...selectedEqIds, id]);
    }
  };

  const addRuleRow = () => {
    if (selectedEqIds.length < 2) {
      alert('Please select at least 2 equipment options in Step 2 first.');
      return;
    }
    setRules([...rules, { equipmentIdA: selectedEqIds[0], equipmentIdB: selectedEqIds[1] }]);
  };

  const updateRuleRow = (index: number, field: 'equipmentIdA' | 'equipmentIdB', value: number) => {
    const updated = [...rules];
    updated[index][field] = value;
    setRules(updated);
  };

  const removeRuleRow = (index: number) => setRules(rules.filter((_, i) => i !== index));

  const handleDelete = async () => {
    if (!editModelName) return;
    try {
      const res = await fetch(`${baseUrl}/api/Copier/delete-by-name?modelName=${encodeURIComponent(editModelName)}`, { method: 'DELETE' });
      if (res.ok) { router.push('/pricelistgenerator'); }
      else { alert('Failed to delete.'); }
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelName.trim()) return alert('Model Name is required');
    for (const r of rules) {
      if (r.equipmentIdA === r.equipmentIdB) {
        alert('An equipment cannot be mutually exclusive with itself!');
        return;
      }
    }
    const finalPayload = {
      modelName, brand, category,
      basicPrice: Number(basicPrice),
      price60Months: Number(price60Months),
      price36Months: Number(price36Months),
      selectedEquipmentIds: selectedEqIds,
      type: type,
      exclusionRules: rules,
    };
    const url    = isEditMode ? `${baseUrl}/api/Copier/update-by-name?modelName=${encodeURIComponent(editModelName!)}` : `${baseUrl}/api/Copier/create-complete`;
    const method = isEditMode ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalPayload) });
      if (res.ok) { router.push('/pricelistgenerator'); }
      else { alert(`Failed: ${await res.text()}`); }
    } catch (error) { console.error(error); }
  };

  const selectedEquipmentsForRules = allEquipments.filter(eq => selectedEqIds.includes(eq.id));
  const fmt = (n: number) => n.toLocaleString('en-MY', { minimumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans">

      {/* ══ Sub-header ══════════════════════════════════════════ */}
        <div className="bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between">
        {/* 左侧：标题与状态图标 */}
        <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isEditMode ? 'bg-amber-50' : 'bg-blue-50'}`}>
            <svg className={`w-4 h-4 ${isEditMode ? 'text-amber-500' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                {isEditMode
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z"/>
                : <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                }
            </svg>
            </div>
            <div>
            <h1 className="text-sm font-bold text-slate-800 leading-tight">
                {isEditMode ? `Edit: ${editModelName}` : 'Create Copier Configuration'}
            </h1>
            <p className="text-[11px] text-slate-400 leading-tight">
                {isEditMode ? 'Update model specs, pricing, and conflict rules' : 'Set up a new copier model with specs and pricing'}
            </p>
            </div>
        </div>

        {/* 右侧：按钮组合 */}
        <div className="flex items-center gap-2">
            
            {/* 🆕 按钮 1: Model List 页面跳转按钮 */}
            <button
            type="button"
            onClick={() => router.push('/pricelistgenerator/manage/adddevice/modellist')} 
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors shadow-sm"
            >
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Model List
            </button>

            {/* 按钮 2: Delete (仅编辑模式可见) */}
            {isEditMode && (
            <button 
                type="button" 
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 text-sm font-semibold text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors"
            >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h6a1 1 0 011 1v1a1 1 0 01-1 1H9z"/>
                </svg>
                Delete
            </button>
            )}

            {/* 按钮 3: Back 按钮 */}
            <button 
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors px-3 py-2 rounded-lg hover:bg-slate-100"
            >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            Back
            </button>
        </div>
        </div>
      <form onSubmit={handleSubmit}>
        <div className="px-8 py-5 max-w-5xl mx-auto space-y-4">

          {/* ══ Step 1: Basic Info ══════════════════════════════════ */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-bold text-white">1</span>
                </div>
                <div>
                <p className="text-sm font-bold text-slate-800">Basic Information</p>
                <p className="text-[11px] text-slate-400">Model identity, brand, series type and pricing structure</p>
                </div>
            </div>

            <div className="px-6 py-5 space-y-4">
                {/* Model name */}
                <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Model Name <span className="text-red-400">*</span>
                </label>
                <input type="text" required placeholder="e.g., Canon IR ADV C3520i"
                    value={modelName} onChange={e => setModelName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"/>
                </div>

                {/* Brand + Category + Dynamic Type Series */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Brand */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Brand</label>
                    <select value={brand} onChange={e => setBrand(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition">
                    <option value="Canon">Canon</option>
                    <option value="KM">KM (Konica Minolta)</option>
                    </select>
                </div>

                {/* Category */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition">
                    <option value="MFP">MFP (Multi-function Printer)</option>
                    <option value="IFP">IFP (Interactive Flat Panel)</option>
                    <option value="LFP">LFP (Large Format Printer)</option>
                    </select>
                </div>

                {/* 🆕 专属动态系列下拉框 (Series Type) */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Series Type</label>
                    <select value={type} onChange={e => setType(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition">
                    {brand === 'Canon' ? (
                        <>
                        <option value="A4 Desktop Series">A4 Desktop Series</option>
                        <option value="A3 Desktop Series">A3 Desktop Series</option>
                        <option value="A3 Light Duty Series">A3 Light Duty Series</option>
                        </>
                    ) : (
                        <>
                        <option value="Light Duty Series">Light Duty Series</option>
                        <option value="Mid-Heavy Duty Series">Mid-Heavy Duty Series</option>
                        <option value="Light Production Series">Light Production Series</option>
                        </>
                    )}
                    </select>
                </div>
                </div>

                {/* Pricing row */}
                <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Outright Price (RM)
                    </label>
                    <input type="number" step="0.01" min="0" value={basicPrice}
                    onChange={e => setBasicPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-blue-700 font-semibold bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"/>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-amber-500 uppercase tracking-wide mb-1.5">
                    36-Month Rental (RM/mo)
                    </label>
                    <input type="number" step="0.01" min="0" value={price36Months}
                    onChange={e => setPrice36Months(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 border border-amber-200 rounded-xl text-sm text-amber-600 font-semibold bg-amber-50/40 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition"/>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-emerald-500 uppercase tracking-wide mb-1.5">
                    60-Month Rental (RM/mo)
                    </label>
                    <input type="number" step="0.01" min="0" value={price60Months}
                    onChange={e => setPrice60Months(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-semibold bg-emerald-50/40 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent transition"/>
                </div>
                </div>

                {/* Live pricing preview */}
                {(basicPrice > 0 || price36Months > 0 || price60Months > 0) && (
                <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex-shrink-0">Preview</span>
                    <div className="flex items-center gap-6 flex-wrap">
                    {basicPrice > 0 && (
                        <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span className="text-xs font-semibold text-blue-600 tabular-nums">RM {fmt(basicPrice)}</span>
                        <span className="text-[10px] text-slate-400">outright</span>
                        </div>
                    )}
                    {price36Months > 0 && (
                        <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span className="text-xs font-semibold text-amber-500 tabular-nums">RM {fmt(price36Months)}/mo</span>
                        <span className="text-[10px] text-slate-400">× 36</span>
                        </div>
                    )}
                    {price60Months > 0 && (
                        <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-xs font-semibold text-emerald-600 tabular-nums">RM {fmt(price60Months)}/mo</span>
                        <span className="text-[10px] text-slate-400">× 60</span>
                        </div>
                    )}
                    </div>
                </div>
                )}
            </div>
            </div>

          {/* ══ Step 2: Equipment Mapping ═══════════════════════════ */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-bold text-white">2</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Assign Equipment Specs</p>
                  <p className="text-[11px] text-slate-400">Choose which optional add-ons apply to this model</p>
                </div>
              </div>
              {selectedEqIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                    {selectedEqIds.length} selected
                  </span>
                  <button type="button" onClick={() => { setSelectedEqIds([]); setRules([]); }}
                    className="text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors">
                    Clear
                  </button>
                </div>
              )}
            </div>

            <div className="px-6 py-4 space-y-3">
              {/* Search */}
              <div className="relative">
                <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input type="text" placeholder="Search specs by name…"
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"/>
              </div>

              {/* Spec list grouped by category */}
              <div className="border border-slate-100 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                {Object.entries(groupByCategory(filteredEquipments)).map(([catName, specs]) => (
                  <div key={catName}>
                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2 sticky top-0 z-10">
                      <span className={`w-1.5 h-1.5 rounded-full ${CAT_STYLE[catName]?.dot ?? 'bg-slate-400'}`} />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{catName}</span>
                      <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded border ${CAT_STYLE[catName]?.badge ?? 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                        {specs.filter(s => selectedEqIds.includes(s.id)).length}/{specs.length}
                      </span>
                    </div>
                    {specs.map(eq => {
                      const checked = selectedEqIds.includes(eq.id);
                      return (
                        <label key={eq.id}
                          className={`flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0 cursor-pointer transition-colors ${checked ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300 hover:border-blue-400'}`}>
                            <input type="checkbox" checked={checked} onChange={() => handleEqToggle(eq.id)} className="sr-only"/>
                            {checked && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${checked ? 'text-blue-700' : 'text-slate-800'}`}>{eq.specName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">ID: {eq.id}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ))}
                {filteredEquipments.length === 0 && (
                  <div className="py-10 text-center text-slate-400 text-sm">No specs match "{searchQuery}"</div>
                )}
              </div>

              {/* Selected chips preview */}
              {selectedEqIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {allEquipments.filter(eq => selectedEqIds.includes(eq.id)).map(eq => (
                    <span key={eq.id}
                      className="inline-flex items-center gap-1 text-[11px] font-medium bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                      <span className={`w-1.5 h-1.5 rounded-full ${CAT_STYLE[eq.category]?.dot ?? 'bg-slate-400'}`} />
                      {eq.specName}
                      <button type="button" onClick={() => handleEqToggle(eq.id)}
                        className="ml-0.5 text-slate-300 hover:text-red-400 transition-colors leading-none">✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ══ Step 3: Exclusion Rules ═════════════════════════════ */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-bold text-white">3</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Mutual Exclusion Rules</p>
                  <p className="text-[11px] text-slate-400">Define which specs cannot be selected together</p>
                </div>
              </div>
              <button type="button" onClick={addRuleRow}
                className="flex items-center gap-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
                Add Rule
              </button>
            </div>

            <div className="px-6 py-4">
              {rules.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-500">No conflict rules defined</p>
                  <p className="text-xs text-slate-400 mt-0.5">All selected specs can be added together freely.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {rules.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-red-50/60 border border-red-100 rounded-xl px-4 py-3">
                      <span className="text-[10px] font-bold text-red-400 bg-white border border-red-200 px-2 py-1 rounded-lg flex-shrink-0">
                        #{idx + 1}
                      </span>
                      <select value={rule.equipmentIdA}
                        onChange={e => updateRuleRow(idx, 'equipmentIdA', Number(e.target.value))}
                        className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-300 transition">
                        {selectedEquipmentsForRules.map(e => (
                          <option key={e.id} value={e.id}>{e.specName}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                        </svg>
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wide">conflicts</span>
                      </div>
                      <select value={rule.equipmentIdB}
                        onChange={e => updateRuleRow(idx, 'equipmentIdB', Number(e.target.value))}
                        className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-300 transition">
                        {selectedEquipmentsForRules.map(e => (
                          <option key={e.id} value={e.id}>{e.specName}</option>
                        ))}
                      </select>
                      <button type="button" onClick={() => removeRuleRow(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-100 transition-colors flex-shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ══ Submit bar ══════════════════════════════════════════ */}
          <div className="bg-white rounded-xl border border-slate-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span>{selectedEqIds.length} spec{selectedEqIds.length !== 1 ? 's' : ''} mapped</span>
              <span className="w-px h-3 bg-slate-200" />
              <span>{rules.length} conflict rule{rules.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => router.back()}
                className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit"
                className={`flex items-center gap-2 px-6 py-2 text-sm font-bold text-white rounded-xl shadow-sm transition-colors ${isEditMode ? 'bg-amber-500 hover:bg-amber-400' : 'bg-blue-600 hover:bg-blue-500'}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  {isEditMode
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  }
                </svg>
                {isEditMode ? 'Update Configuration' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* ══ Delete Confirm Modal ════════════════════════════════ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Delete "{editModelName}"?</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  This will permanently remove the model, all equipment mappings, and custom conflict rules. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-400 text-white rounded-xl shadow-sm transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}