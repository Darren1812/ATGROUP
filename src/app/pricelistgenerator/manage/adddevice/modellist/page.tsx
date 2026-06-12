'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface CopierModel {
  id: number;
  modelName: string;
  brand: string;
  category: string;
  type: string;
  basicPrice: number;
  price36Months: number;
  price60Months: number;
}

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

export default function ModelListPage() {
  const router  = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  // ── List state ─────────────────────────────────────────────
  const [models,    setModels]    = useState<CopierModel[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'Canon' | 'KM'>('ALL');

  // ── Modal state ────────────────────────────────────────────
  const [isEditModalOpen,   setIsEditModalOpen]   = useState(false);
  const [submitting,        setSubmitting]         = useState(false);
  const [loadingSpec,       setLoadingSpec]        = useState(false);
  const [selectedModelId,   setSelectedModelId]    = useState<number | null>(null);
  const [originalModelName, setOriginalModelName]  = useState('');

  // ── All available specs (for the picker) ──────────────────
  const [allEquipments, setAllEquipments] = useState<EquipmentSpec[]>([]);
  const [specSearch,    setSpecSearch]    = useState('');

  // ── Form fields ────────────────────────────────────────────
  const [formModelName,     setFormModelName]     = useState('');
  const [formBrand,         setFormBrand]         = useState('Canon');
  const [formCategory,      setFormCategory]      = useState('MFP');
  const [formType,          setFormType]          = useState('A4 Desktop Series');
  const [formBasicPrice,    setFormBasicPrice]    = useState<number>(0);
  const [formPrice36Months, setFormPrice36Months] = useState<number>(0);
  const [formPrice60Months, setFormPrice60Months] = useState<number>(0);

  // ── Spec + rule editing ────────────────────────────────────
  const [selectedEqIds, setSelectedEqIds] = useState<number[]>([]);
  const [rules,         setRules]         = useState<ExclusionRuleInput[]>([]);

  // ── Active tab inside modal ────────────────────────────────
  const [modalTab, setModalTab] = useState<'info' | 'specs' | 'rules'>('info');

  // ── Delete confirm ─────────────────────────────────────────
  const [deleteConfirmId,   setDeleteConfirmId]   = useState<number | null>(null);
  const [deleteModelName,   setDeleteModelName]   = useState('');

  // ══════════════════════════════════════════════════════════
  // API: fetch list
  // ══════════════════════════════════════════════════════════
  const fetchAllModels = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/api/Copier`);
      if (res.ok) setModels(await res.json());
    } catch (err) { console.error('Network error fetching models:', err); }
    finally { setLoading(false); }
  };

  // API: fetch all equipment specs (for picker)
  const fetchAllSpecs = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/EquipmentSpec`);
      if (res.ok) setAllEquipments(await res.json());
    } catch (err) { console.error('Error fetching specs:', err); }
  };

  useEffect(() => {
    fetchAllModels();
    fetchAllSpecs();
  }, [baseUrl]);

  // ══════════════════════════════════════════════════════════
  // Open edit modal
  // ══════════════════════════════════════════════════════════
  const openEditModal = async (item: CopierModel) => {
    setSelectedModelId(item.id);
    setOriginalModelName(item.modelName);
    setFormModelName(item.modelName);
    setFormBrand(item.brand || 'Canon');
    setFormCategory(item.category || 'MFP');
    setFormType(item.type || (item.brand === 'Canon' ? 'A4 Desktop Series' : 'Light Duty Series'));
    setFormBasicPrice(item.basicPrice);
    setFormPrice36Months(item.price36Months);
    setFormPrice60Months(item.price60Months);
    setSelectedEqIds([]);
    setRules([]);
    setSpecSearch('');
    setModalTab('info');
    setIsEditModalOpen(true);
    setLoadingSpec(true);

    try {
      const res = await fetch(`${baseUrl}/api/Copier/config-by-name?modelName=${encodeURIComponent(item.modelName)}`);
      if (res.ok) {
        const fullConfig = await res.json();
        // API returns specName (not equipmentName) — use it directly
        const eqIds = (fullConfig.equipments || []).map((eq: any) => eq.id);
        setSelectedEqIds(eqIds);
        // Only keep model-specific rules (modelId !== null)
        const exclusiveRules = (fullConfig.rules || [])
          .filter((r: any) => r.modelId !== null)
          .map((r: any) => ({ equipmentIdA: r.equipmentIdA, equipmentIdB: r.equipmentIdB }));
        setRules(exclusiveRules);
      }
    } catch (err) { console.error('Failed to load config:', err); }
    finally { setLoadingSpec(false); }
  };

  // ══════════════════════════════════════════════════════════
  // Spec toggle helpers
  // ══════════════════════════════════════════════════════════
  const handleEqToggle = (id: number) => {
    if (selectedEqIds.includes(id)) {
      setSelectedEqIds(prev => prev.filter(i => i !== id));
      setRules(prev => prev.filter(r => r.equipmentIdA !== id && r.equipmentIdB !== id));
    } else {
      setSelectedEqIds(prev => [...prev, id]);
    }
  };

  const addRuleRow = () => {
    if (selectedEqIds.length < 2) { alert('Select at least 2 specs first.'); return; }
    setRules(prev => [...prev, { equipmentIdA: selectedEqIds[0], equipmentIdB: selectedEqIds[1] }]);
  };

  const updateRuleRow = (idx: number, field: 'equipmentIdA' | 'equipmentIdB', value: number) => {
    const updated = [...rules];
    updated[idx][field] = value;
    setRules(updated);
  };

  const removeRuleRow = (idx: number) => setRules(prev => prev.filter((_, i) => i !== idx));

  // ══════════════════════════════════════════════════════════
  // Submit update (passes specs + rules so they get saved)
  // ══════════════════════════════════════════════════════════
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModelId) return;

    for (const r of rules) {
      if (r.equipmentIdA === r.equipmentIdB) {
        alert('A spec cannot conflict with itself!'); return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        model: {
          modelName: formModelName,
          brand: formBrand,
          category: formCategory,
          type: formType,
          basicPrice: Number(formBasicPrice),
          price36Months: Number(formPrice36Months),
          price60Months: Number(formPrice60Months),
          selectedEquipmentIds: [],
          exclusionRules: [],
        },
        // Pass the full updated spec list so the backend saves it
        equipments: selectedEqIds.map(id => ({ id })),
        // Pass updated rules
        rules: rules.map(r => ({ equipmentIdA: r.equipmentIdA, equipmentIdB: r.equipmentIdB })),
      };

      const res = await fetch(`${baseUrl}/api/Copier/update-by-id/${selectedModelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        await fetchAllModels();
      } else {
        alert(`Update failed: ${await res.text()}`);
      }
    } catch (err) { console.error('Error during update:', err); }
    finally { setSubmitting(false); }
  };

  // ══════════════════════════════════════════════════════════
  // Delete
  // ══════════════════════════════════════════════════════════
  const handleDelete = async () => {
    if (!deleteModelName) return;
    try {
      const res = await fetch(`${baseUrl}/api/Copier/delete-by-name?modelName=${encodeURIComponent(deleteModelName)}`, { method: 'DELETE' });
      if (res.ok) { setDeleteConfirmId(null); setIsEditModalOpen(false); await fetchAllModels(); }
      else { alert('Failed to delete.'); }
    } catch (err) { console.error(err); }
  };

  const handleBrandChangeInForm = (newBrand: string) => {
    setFormBrand(newBrand);
    setFormType(newBrand === 'Canon' ? 'A4 Desktop Series' : 'Light Duty Series');
  };

  // ══════════════════════════════════════════════════════════
  // Derived
  // ══════════════════════════════════════════════════════════
  const filteredModels       = models.filter(m => activeTab === 'ALL' || m.brand?.toUpperCase() === activeTab);
  const filteredSpecs        = allEquipments.filter(eq => eq.specName.toLowerCase().includes(specSearch.toLowerCase()));
  const selectedEquipObjs    = allEquipments.filter(eq => selectedEqIds.includes(eq.id));
  const fmt                  = (n: number) => n?.toLocaleString('en-MY', { minimumFractionDigits: 2 }) || '0.00';

  const MODAL_TABS = [
    { key: 'info',  label: 'Basic Info',   count: null },
    { key: 'specs', label: 'Specs',        count: selectedEqIds.length },
    { key: 'rules', label: 'Conflict Rules', count: rules.length },
  ] as const;

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans">

      {/* ══ Sub-header ════════════════════════════════════════ */}
      <div className="bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 leading-tight">Copier Model Inventory</h1>
            <p className="text-[11px] text-slate-400 leading-tight">System database catalog — live sync</p>
          </div>
        </div>
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
      </div>

      <div className="px-8 py-5 max-w-7xl mx-auto space-y-4">

        {/* ══ Brand filter chips ══════════════════════════════ */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {(['ALL', 'Canon', 'KM'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  activeTab === tab
                    ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}>
                {tab === 'ALL' ? 'All Brands' : tab}
                <span className={`ml-1.5 tabular-nums ${activeTab === tab ? 'opacity-60' : 'text-slate-400'}`}>
                  {tab === 'ALL' ? models.length : models.filter(m => m.brand?.toUpperCase() === tab).length}
                </span>
              </button>
            ))}
          </div>
          <span className="text-[11px] text-slate-400">
            Showing <span className="font-semibold text-slate-600">{filteredModels.length}</span> of {models.length} models
          </span>
        </div>

        {/* ══ Table card ══════════════════════════════════════ */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <svg className="w-7 h-7 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <span className="text-sm">Loading models…</span>
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
              <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-sm font-medium">No models found</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Model</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Class &amp; Series</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 text-right">Outright (RM)</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 text-right">36 mo /mo</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 text-right">60 mo /mo</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredModels.map((item, idx) => (
                  <tr key={item.id}
                    className={`group border-b border-slate-100 last:border-0 hover:bg-blue-50/30 transition-colors ${idx % 2 !== 0 ? 'bg-slate-50/30' : ''}`}>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-bold text-slate-800">{item.modelName}</p>
                      <p className="text-[10px] font-mono text-slate-300 mt-0.5">UID #{item.id}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${item.brand === 'Canon' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-cyan-50 text-cyan-700 border-cyan-100'}`}>
                          {item.brand}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase">{item.category}</span>
                        {item.type && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">{item.type}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-bold text-slate-800 tabular-nums">RM {fmt(item.basicPrice)}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-semibold text-amber-500 tabular-nums">RM {fmt(item.price36Months)}</span>
                      <span className="text-[10px] text-slate-400">/mo</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-semibold text-emerald-600 tabular-nums">RM {fmt(item.price60Months)}</span>
                      <span className="text-[10px] text-slate-400">/mo</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button onClick={() => openEditModal(item)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && filteredModels.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
              <p className="text-[10px] text-slate-400">AT Group Marketing Platform · Database Model Sync View</p>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          EDIT MODAL — tabbed: Info / Specs / Rules
      ══════════════════════════════════════════════════════ */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />

          <form onSubmit={handleUpdateSubmit}
            className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-10"
            style={{ maxHeight: '90vh' }}>

            {/* Modal header */}
            <div className="bg-white border-b border-slate-100 px-6 pt-5 pb-0 flex-shrink-0">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Edit Model Configuration</p>
                    <p className="text-[11px] text-slate-400 font-mono">{originalModelName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button"
                    onClick={() => { setDeleteModelName(originalModelName); setDeleteConfirmId(selectedModelId); }}
                    className="flex items-center gap-1 text-xs font-semibold text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h6a1 1 0 011 1v1a1 1 0 01-1 1H9z"/>
                    </svg>
                    Delete
                  </button>
                  <button type="button" onClick={() => setIsEditModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1">
                {MODAL_TABS.map(t => (
                  <button key={t.key} type="button" onClick={() => setModalTab(t.key)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                      modalTab === t.key
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}>
                    {t.label}
                    {t.count !== null && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${modalTab === t.key ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                        {t.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">

              {/* ── TAB: Basic Info ── */}
              {modalTab === 'info' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Model Name</label>
                    <input type="text" required value={formModelName} onChange={e => setFormModelName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"/>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Brand</label>
                      <select value={formBrand} onChange={e => handleBrandChangeInForm(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition">
                        <option value="Canon">Canon</option>
                        <option value="KM">KM (Konica Minolta)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Category</label>
                      <select value={formCategory} onChange={e => setFormCategory(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition">
                        <option value="MFP">MFP</option>
                        <option value="IFP">IFP</option>
                        <option value="LFP">LFP</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Series Type</label>
                      <select value={formType} onChange={e => setFormType(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition">
                        {formBrand === 'Canon' ? (
                          <>
                            <option value="A4 Desktop Series">A4 Desktop</option>
                            <option value="A3 Desktop Series">A3 Desktop</option>
                            <option value="A3 Light Duty Series">A3 Light Duty</option>
                          </>
                        ) : (
                          <>
                            <option value="Light Duty Series">Light Duty</option>
                            <option value="Mid-Heavy Duty Series">Mid-Heavy Duty</option>
                            <option value="Light Production Series">Light Production</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Outright (RM)</label>
                      <input type="number" step="0.01" min="0" value={formBasicPrice} onChange={e => setFormBasicPrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"/>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-amber-500 uppercase tracking-wide mb-1.5">36 Mo /mo</label>
                      <input type="number" step="0.01" min="0" value={formPrice36Months} onChange={e => setFormPrice36Months(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2.5 border border-amber-200 rounded-xl text-sm font-semibold text-amber-600 bg-amber-50/40 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition"/>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-emerald-500 uppercase tracking-wide mb-1.5">60 Mo /mo</label>
                      <input type="number" step="0.01" min="0" value={formPrice60Months} onChange={e => setFormPrice60Months(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2.5 border border-emerald-200 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50/40 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent transition"/>
                    </div>
                  </div>
                  {/* Pricing preview */}
                  <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preview</span>
                    <div className="flex items-center gap-5 flex-wrap">
                      <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"/><span className="text-xs font-semibold text-blue-600 tabular-nums">RM {fmt(formBasicPrice)}</span><span className="text-[10px] text-slate-400">outright</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"/><span className="text-xs font-semibold text-amber-500 tabular-nums">RM {fmt(formPrice36Months)}/mo</span><span className="text-[10px] text-slate-400">× 36</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"/><span className="text-xs font-semibold text-emerald-600 tabular-nums">RM {fmt(formPrice60Months)}/mo</span><span className="text-[10px] text-slate-400">× 60</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB: Specs ── */}
              {modalTab === 'specs' && (
                <div className="space-y-3">
                  {loadingSpec ? (
                    <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
                      <svg className="w-5 h-5 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      <span className="text-sm">Loading specs…</span>
                    </div>
                  ) : (
                    <>
                      {/* Search */}
                      <div className="relative">
                        <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                        <input type="text" placeholder="Search specs by name…" value={specSearch} onChange={e => setSpecSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"/>
                      </div>

                      {/* Spec list grouped */}
                      <div className="border border-slate-100 rounded-xl overflow-hidden" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        {Object.entries(groupByCategory(filteredSpecs)).map(([catName, specs]) => (
                          <div key={catName}>
                            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2 sticky top-0 z-10">
                              <span className={`w-1.5 h-1.5 rounded-full ${CAT_STYLE[catName]?.dot ?? 'bg-slate-400'}`}/>
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
                      </div>

                      {/* Selected chips */}
                      {selectedEqIds.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest self-center mr-1">Selected:</span>
                          {selectedEquipObjs.map(eq => (
                            <span key={eq.id} className="inline-flex items-center gap-1 text-[11px] font-medium bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                              <span className={`w-1.5 h-1.5 rounded-full ${CAT_STYLE[eq.category]?.dot ?? 'bg-slate-400'}`}/>
                              {eq.specName}
                              <button type="button" onClick={() => handleEqToggle(eq.id)} className="ml-0.5 text-slate-300 hover:text-red-400 transition-colors leading-none">✕</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── TAB: Conflict Rules ── */}
              {modalTab === 'rules' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">Rules only apply to specs selected in the Specs tab.</p>
                    <button type="button" onClick={addRuleRow}
                      className="flex items-center gap-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                      </svg>
                      Add Rule
                    </button>
                  </div>

                  {rules.length === 0 ? (
                    <div className="py-10 text-center">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-2">
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-slate-500">No conflict rules</p>
                      <p className="text-xs text-slate-400 mt-0.5">All specs can be freely combined.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {rules.map((rule, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 bg-red-50/60 border border-red-100 rounded-xl px-4 py-3">
                          <span className="text-[10px] font-bold text-red-400 bg-white border border-red-200 px-2 py-1 rounded-lg flex-shrink-0">#{idx + 1}</span>
                          <select value={rule.equipmentIdA} onChange={e => updateRuleRow(idx, 'equipmentIdA', Number(e.target.value))}
                            className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-300 transition">
                            {selectedEquipObjs.map(e => <option key={e.id} value={e.id}>{e.specName}</option>)}
                          </select>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                            </svg>
                          </div>
                          <select value={rule.equipmentIdB} onChange={e => updateRuleRow(idx, 'equipmentIdB', Number(e.target.value))}
                            className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-300 transition">
                            {selectedEquipObjs.map(e => <option key={e.id} value={e.id}>{e.specName}</option>)}
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
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{selectedEqIds.length} spec{selectedEqIds.length !== 1 ? 's' : ''}</span>
                <span className="w-px h-3 bg-slate-200"/>
                <span>{rules.length} rule{rules.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-400 disabled:bg-amber-300 text-white rounded-xl shadow-sm transition-colors">
                  {submitting ? (
                    <><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Saving…</>
                  ) : (
                    <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>Save Changes</>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ══ Delete confirm modal ════════════════════════════ */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Delete "{deleteModelName}"?</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  This permanently removes the model, all equipment mappings, and conflict rules. Cannot be undone.
                </p>
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-2">
              <button onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleDelete}
                className="flex-1 px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-400 text-white rounded-xl shadow-sm transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}