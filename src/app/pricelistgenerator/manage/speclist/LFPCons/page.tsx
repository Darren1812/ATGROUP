"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

interface HardwareOption {
  id: number;
  displayName: string;
}

interface PlotterConsumable {
  id: number;
  consType: string;
  productName: string;
  mercuryCode: string;
  listPrice: number;
  hardwares?: any[];
}

const API_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

const getCategoryStyle = (type: string) => {
  const upper = type.toUpperCase();
  if (upper.includes("INK"))        return { badge: "bg-sky-50 text-sky-600 border-sky-100",       dot: "bg-sky-400" };
  if (upper.includes("HEAD"))       return { badge: "bg-violet-50 text-violet-600 border-violet-100", dot: "bg-violet-400" };
  if (upper.includes("CARTRIDGE") || upper.includes("MAINTENANCE"))
                                    return { badge: "bg-indigo-50 text-indigo-600 border-indigo-100", dot: "bg-indigo-400" };
  if (upper.includes("SERIES") || upper.includes("MEDIA"))
                                    return { badge: "bg-blue-50 text-blue-600 border-blue-100",     dot: "bg-blue-400" };
  return                            { badge: "bg-slate-50 text-slate-500 border-slate-200",         dot: "bg-slate-400" };
};

export default function PlotterConsumablesPage() {
  const router = useRouter();

  const [consumables,      setConsumables]      = useState<PlotterConsumable[]>([]);
  const [hardwareOptions,  setHardwareOptions]  = useState<HardwareOption[]>([]);
  const [activeTab,        setActiveTab]        = useState<string>("All");
  const [loading,          setLoading]          = useState(false);
  const [fetching,         setFetching]         = useState(false);
  const [message,          setMessage]          = useState({ type: "", text: "" });

  // ── Form state ────────────────────────────────────────────
  const [isFormOpen,         setIsFormOpen]         = useState(false);
  const [isEditing,          setIsEditing]          = useState(false);
  const [editingId,          setEditingId]          = useState<number | null>(null);
  const [formData,           setFormData]           = useState({ consType: "", productName: "", mercuryCode: "", listPrice: 0 });
  const [selectedHardwareIds,setSelectedHardwareIds]= useState<number[]>([]);

  // ── Expanded row state (stores consumable id whose details are open) ──
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [expandedData,  setExpandedData]  = useState<PlotterConsumable | null>(null);
  const [expandLoading, setExpandLoading] = useState(false);
  const [hardwareSearchTerm, setHardwareSearchTerm] = useState("");
  // ── Data fetch ─────────────────────────────────────────────
  useEffect(() => { fetchConsumables(); fetchHardwareOptions(); }, []);

  const fetchConsumables = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE}/PlotterConsumable`);
      if (res.ok) setConsumables(await res.json());
    } catch (err) { console.error(err); }
    finally { setFetching(false); }
  };

  const fetchHardwareOptions = async () => {
    try {
      const res = await fetch(`${API_BASE}/PlotterConsumable/hardware-options`);
      if (res.ok) setHardwareOptions(await res.json());
    } catch (err) { console.error(err); }
  };

  // ── Toggle row expand ─────────────────────────────────────
  const handleToggleRow = async (id: number) => {
    // If already open → close
    if (expandedRowId === id) {
      setExpandedRowId(null);
      setExpandedData(null);
      return;
    }
    setExpandedRowId(id);
    setExpandedData(null);
    setExpandLoading(true);
    try {
      const res = await fetch(`${API_BASE}/PlotterConsumable/${id}`);
      if (res.ok) setExpandedData(await res.json());
    } catch (err) { console.error(err); }
    finally { setExpandLoading(false); }
  };

  // ── Form open helpers ─────────────────────────────────────
  const openAddForm = () => {
    if (isFormOpen && !isEditing) { closeForm(); return; } // toggle off
    setFormData({ consType: "", productName: "", mercuryCode: "", listPrice: 0 });
    setSelectedHardwareIds([]);
    setIsEditing(false);
    setEditingId(null);
    setIsFormOpen(true);
  };

  const handleEdit = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/PlotterConsumable/${id}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setFormData({ consType: data.consType, productName: data.productName, mercuryCode: data.mercuryCode, listPrice: data.listPrice });
      setSelectedHardwareIds(data.hardwares?.map((h: any) => h.id) || []);
      setEditingId(id);
      setIsEditing(true);
      setIsFormOpen(true);
      // scroll to top smoothly
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) { alert("Failed to load consumable"); }
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setIsEditing(false);
    setEditingId(null);
    setFormData({ consType: "", productName: "", mercuryCode: "", listPrice: 0 });
    setSelectedHardwareIds([]);
    setHardwareSearchTerm("");
  };

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this consumable? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API_BASE}/PlotterConsumable/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      setMessage({ type: "success", text: result.message });
      if (expandedRowId === id) { setExpandedRowId(null); setExpandedData(null); }
      fetchConsumables();
    } catch (err: any) { setMessage({ type: "error", text: err.message }); }
  };

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      if (isEditing && editingId) {
        const res = await fetch(`${API_BASE}/PlotterConsumable/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, hardwareIds: selectedHardwareIds }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message);
        setMessage({ type: "success", text: result.message });
      } else {
        const res = await fetch(`${API_BASE}/PlotterConsumable`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error("Failed to create consumable.");
        const newItem = await res.json();
        if (selectedHardwareIds.length > 0) {
          const bindRes = await fetch(`${API_BASE}/PlotterConsumable/bind-relations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ consumableId: newItem.id, hardwareIds: selectedHardwareIds }),
          });
          if (!bindRes.ok) throw new Error("Consumable created but hardware binding failed.");
        }
        setMessage({ type: "success", text: "Consumable saved successfully." });
      }
      closeForm();
      fetchConsumables();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Unexpected error" });
    } finally { setLoading(false); }
  };

  // ── Derived ───────────────────────────────────────────────
  const tabsSummary = useMemo(() => {
    const s: Record<string, number> = { All: consumables.length };
    consumables.forEach(c => { const t = c.consType || "Others"; s[t] = (s[t] || 0) + 1; });
    return s;
  }, [consumables]);

  const filteredConsumables = useMemo(() =>
    activeTab === "All" ? consumables : consumables.filter(c => c.consType === activeTab),
    [consumables, activeTab]
  );

  const fmt = (n: number) => n.toLocaleString("en-MY", { minimumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans">

      {/* ── Sub-header ─────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 leading-tight">LFP Consumables</h1>
            <p className="text-[11px] text-slate-400 leading-tight">Ink tanks, media, maintenance — linked to plotter hardware</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
          <button onClick={openAddForm}
            className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm ${
              isFormOpen && !isEditing
                ? "bg-slate-200 text-slate-600 hover:bg-slate-300"
                : "bg-slate-900 hover:bg-slate-700 text-white"
            }`}>
            {isFormOpen && !isEditing ? (
              <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>Cancel</>
            ) : (
              <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>Add Consumable</>
            )}
          </button>
        </div>
      </div>

      <div className="px-8 py-5 max-w-7xl mx-auto space-y-4">

        {/* ── Flash message ──────────────────────────────────── */}
        {message.text && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}>
            <div className="flex items-center justify-between">
              <span>{message.text}</span>
              <button onClick={() => setMessage({ type: "", text: "" })} className="text-current opacity-50 hover:opacity-100 transition-opacity ml-4">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* ── Inline Add / Edit form ─────────────────────────── */}
        {isFormOpen && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Form header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isEditing ? 'bg-amber-500' : 'bg-slate-900'}`}>
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    {isEditing
                      ? <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z"/>
                      : <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                    }
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{isEditing ? "Edit Consumable" : "New Consumable"}</p>
                  <p className="text-[11px] text-slate-400">{isEditing ? "Update details and hardware links" : "Fill in details and link to compatible plotter hardware"}</p>
                </div>
              </div>
              <button onClick={closeForm} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Product Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Product Name <span className="text-red-400">*</span>
                  </label>
                  <input type="text" required placeholder="e.g., PFI-8120 Matte Black 130ml"
                    value={formData.productName}
                    onChange={e => setFormData({ ...formData, productName: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition"/>
                </div>

                {/* Consumable Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Consumable Type <span className="text-red-400">*</span>
                  </label>
                  <input type="text" required placeholder="e.g., Ink Tank, Print Head, Media"
                    value={formData.consType}
                    onChange={e => setFormData({ ...formData, consType: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition"/>
                </div>

                {/* Mercury Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Mercury Code <span className="text-red-400">*</span>
                  </label>
                  <input type="text" required placeholder="e.g., 2889C001AA"
                    value={formData.mercuryCode}
                    onChange={e => setFormData({ ...formData, mercuryCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 placeholder-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition"/>
                </div>

                {/* List Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    List Price (RM) <span className="text-red-400">*</span>
                  </label>
                  <input type="number" required min="0" step="0.01" placeholder="0.00"
                    value={formData.listPrice || ""}
                    onChange={e => setFormData({ ...formData, listPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 border border-blue-200 rounded-xl text-sm font-semibold text-blue-700 bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"/>
                </div>

                {/* Hardware links */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Compatible Plotter Hardware
                    </label>
                    {selectedHardwareIds.length > 0 && (
                      <span className="text-[10px] font-bold text-white bg-slate-900 px-2 py-0.5 rounded-full">
                        {selectedHardwareIds.length} Selected
                      </span>
                    )}
                  </div>

                  {/* Search Bar */}
                  <div className="relative mb-2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search hardware model or code..."
                      value={hardwareSearchTerm}
                      onChange={(e) => setHardwareSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition"
                    />
                  </div>

                  {/* Hardware List Container with Scrolldown */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-48 overflow-y-auto custom-scrollbar flex flex-wrap gap-2 content-start">
                    {hardwareOptions.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">No hardware products found.</p>
                    ) : (() => {
                      // 过滤搜索结果
                      const filtered = hardwareOptions.filter(hw => 
                        hw.displayName.toLowerCase().includes(hardwareSearchTerm.toLowerCase())
                      );

                      if (filtered.length === 0) {
                        return <p className="text-xs text-slate-400 italic py-2 w-full text-center">No matching hardware found.</p>;
                      }

                      return filtered.map(hw => {
                        const isSelected = selectedHardwareIds.includes(hw.id);
                        return (
                          <button
                            key={hw.id}
                            type="button"
                            onClick={() =>
                              setSelectedHardwareIds(prev =>
                                isSelected ? prev.filter(id => id !== hw.id) : [...prev, hw.id]
                              )
                            }
                            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all border flex items-center gap-1.5 ${
                              isSelected
                                ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                            }`}
                          >
                            {isSelected && (
                              <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                            {hw.displayName}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

              {/* Form footer */}
              <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2">
                <button type="button" onClick={closeForm}
                  className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className={`flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white rounded-xl shadow-sm transition-colors disabled:opacity-50 ${
                    isEditing ? "bg-amber-500 hover:bg-amber-400" : "bg-slate-900 hover:bg-slate-700"
                  }`}>
                  {loading ? (
                    <><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Saving…</>
                  ) : isEditing ? (
                    <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>Update Consumable</>
                  ) : (
                    <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>Save Consumable</>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Category tab pills ────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          {Object.keys(tabsSummary).map(tab => {
            const active = activeTab === tab;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  active ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                }`}>
                {tab}
                <span className={`tabular-nums ${active ? "opacity-60" : "text-slate-400"}`}>{tabsSummary[tab]}</span>
              </button>
            );
          })}
        </div>

        {/* ── Table ────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {fetching ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <svg className="w-7 h-7 animate-spin text-orange-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <span className="text-sm">Loading consumables…</span>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 w-12 text-center">#</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Product</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Type</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 text-right">List Price (RM)</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 text-center w-36">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredConsumables.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                        </svg>
                        <p className="text-sm font-medium">No consumables in this category</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredConsumables.map((item, idx) => {
                    const style    = getCategoryStyle(item.consType);
                    const isOpen   = expandedRowId === item.id;
                    const isLoading= isOpen && expandLoading;

                    return (
                      <React.Fragment key={item.id}>
                        {/* ── Main row ── */}
                        <tr
                          className={`group border-b border-slate-100 transition-colors ${
                            isOpen ? "bg-slate-50" : idx % 2 !== 0 ? "bg-slate-50/30 hover:bg-slate-50" : "hover:bg-slate-50"
                          }`}>
                          <td className="px-5 py-3.5 text-center">
                            <span className="text-[10px] font-mono text-slate-300 font-bold">{String(idx + 1).padStart(3, "0")}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="text-sm font-bold text-slate-800">{item.productName}</p>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">{item.mercuryCode}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${style.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}/>
                              {item.consType}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className="text-sm font-bold text-slate-800 tabular-nums">RM {fmt(item.listPrice)}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* View / Close toggle */}
                              <button onClick={() => handleToggleRow(item.id)}
                                className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-colors ${
                                  isOpen
                                    ? "bg-slate-800 text-white hover:bg-slate-700"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}>
                                {isOpen ? (
                                  <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/></svg>Close</>
                                ) : (
                                  <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>View</>
                                )}
                              </button>

                              {/* Edit */}
                              <button onClick={() => handleEdit(item.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z"/>
                                </svg>
                              </button>

                              {/* Delete */}
                              <button onClick={() => handleDelete(item.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h6a1 1 0 011 1v1a1 1 0 01-1 1H9z"/>
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* ── Expanded compatibility row ── */}
                        {isOpen && (
                          <tr key={`${item.id}-expand`} className="border-b border-slate-100">
                            <td colSpan={5} className="px-5 py-0">
                              <div className="py-4 pl-12">
                                {isLoading ? (
                                  <div className="flex items-center gap-2 text-slate-400 py-2">
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                    </svg>
                                    <span className="text-xs">Loading compatible hardware…</span>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                      Compatible Plotter Hardware
                                    </p>
                                    {expandedData?.hardwares && expandedData.hardwares.length > 0 ? (
                                      <div className="flex flex-wrap gap-2">
                                        {expandedData.hardwares.map((hw: any) => (
                                          <div key={hw.id}
                                            className="flex items-center gap-2.5 bg-slate-900 text-white px-3 py-2 rounded-lg">
                                            <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center flex-shrink-0">
                                              <svg className="w-3 h-3 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                                              </svg>
                                            </div>
                                            <div>
                                              <p className="text-xs font-bold text-slate-100 leading-tight">{hw.productName}</p>
                                              <p className="text-[10px] font-mono text-slate-400 leading-tight">{hw.productCode} · {hw.productType}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-slate-400 italic">Not linked to any hardware yet.</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {/* Footer */}
          {!fetching && filteredConsumables.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <p className="text-[10px] text-slate-400">
                {filteredConsumables.length} consumable{filteredConsumables.length !== 1 ? "s" : ""} · {activeTab === "All" ? "all categories" : activeTab}
              </p>
              <p className="text-[10px] text-slate-400">AT Group · LFP Consumables Catalog</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}