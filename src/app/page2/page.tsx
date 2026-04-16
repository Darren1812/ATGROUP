"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FileUp, FileCheck, ChevronDown, Package,
  Loader2, Plus, X, Trash2, Edit3, Calendar,
  MapPin, Truck, User, Clock, Search,
  ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";

interface LogisticsTaskDto {
  id: number;
  from: string;
  companyName: string;
  location: string;
  item: string;
  time: string;
  picDeliver: string;
  status: string;
  hasInstallationForm: boolean;
  hasDo: boolean;
  createdAt: string;
  scheduledAt: string;
}

type SortKey = "createdAt" | "time" | "from" | "companyName" | "location" | "item" | "picDeliver" | "scheduledAt" | "status" | null;
type SortDir = "asc" | "desc";

/* ── STATUS CONFIG ── */
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  WAITING: { label: "Waiting", color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)",  dot: "#F59E0B" },
  ARRANGE: { label: "Arrange", color: "#38BDF8", bg: "rgba(56,189,248,0.1)",  border: "rgba(56,189,248,0.25)",  dot: "#38BDF8" },
};
const getStatus = (s: string) => STATUS_CFG[s?.toUpperCase()] ?? STATUS_CFG.WAITING;

const toLocalDT = (d: string | Date) => {
  const dt = new Date(d);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${p(dt.getMonth()+1)}-${p(dt.getDate())}T${p(dt.getHours())}:${p(dt.getMinutes())}`;
};
const fmtDate = (d: string) =>
  new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true });

/* ── SORT ICON ── */
function SortIcon({ colKey, sortKey, sortDir }: { colKey: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== colKey) return <ArrowUpDown size={10} style={{ opacity: 0.3, marginLeft: 4, flexShrink: 0 }} />;
  return sortDir === "asc"
    ? <ArrowUp size={10} style={{ color: "#38BDF8", marginLeft: 4, flexShrink: 0 }} />
    : <ArrowDown size={10} style={{ color: "#38BDF8", marginLeft: 4, flexShrink: 0 }} />;
}

/* ── DOC BUTTON ── */
function DocBtn({ hasFile, onView, onUpload, label }: { hasFile: boolean; onView: () => void; onUpload: () => void; label: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <button onClick={() => hasFile ? setOpen(!open) : onUpload()} title={label}
        style={{ width: 34, height: 34, borderRadius: 10, border: hasFile ? "1px solid rgba(52,211,153,0.3)" : "1.5px dashed rgba(255,255,255,0.12)", background: hasFile ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.03)", color: hasFile ? "#34D399" : "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
        {hasFile ? <FileCheck size={14} /> : <Plus size={13} />}
        {hasFile && <span style={{ position: "absolute", top: -3, right: -3, width: 7, height: 7, borderRadius: 99, background: "#34D399", border: "2px solid #0d1117" }} />}
      </button>
      <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
      {open && hasFile && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: "160%", transform: "translateX(-50%)", width: 140, background: "#161c28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, boxShadow: "0 16px 40px rgba(0,0,0,0.5)", zIndex: 100, overflow: "hidden" }}>
          <button onClick={() => { onView(); setOpen(false); }} style={{ width: "100%", padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.65)", background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}>
            <FileUp size={13} style={{ color: "#34D399" }} /> View PDF
          </button>
          <button onClick={() => { onUpload(); setOpen(false); }} style={{ width: "100%", padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 600, color: "#38BDF8", background: "none", border: "none", cursor: "pointer" }}>
            <Edit3 size={13} /> Replace
          </button>
        </div>
      )}
    </div>
  );
}

/* ── MOBILE CARD ── */
function MobileCard({ task, driverList, openStatusId, setOpenStatusId, openPicId, setOpenPicId, handleStatusUpdate, handlePicUpdate, handleViewPdf, triggerUpload, handleEditClick, handleDelete, handleScheduleUpdate }: any) {
  const sc = getStatus(task.status);
  const [localDT, setLocalDT] = useState(task.scheduledAt ? toLocalDT(task.scheduledAt) : "");

  return (
    <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.companyName}</p>
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.location)}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 11, color: "#34D399", display: "flex", alignItems: "center", gap: 3, marginTop: 3 }}>
              <MapPin size={10} /> {task.location}
            </span>
          </a>
        </div>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button onClick={() => setOpenStatusId(openStatusId === task.id ? null : task.id)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 99, border: `1px solid ${sc.border}`, background: sc.bg, color: sc.color, fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: sc.dot }} />{sc.label}
          </button>
          {openStatusId === task.id && (
            <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", width: 130, background: "#161c28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, zIndex: 50, overflow: "hidden", boxShadow: "0 16px 40px rgba(0,0,0,0.5)" }}>
              {["Waiting", "Arrange"].map(s => (
                <button key={s} onClick={() => handleStatusUpdate(task.id, s)} style={{ width: "100%", padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>{s}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { icon: <Truck size={11} />, label: "Item", value: task.item, color: "#38BDF8" },
          { icon: <MapPin size={11} />, label: "From", value: task.from, color: undefined },
        ].map(({ icon, label, value, color }) => (
          <div key={label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
              <span style={{ color: "rgba(255,255,255,0.25)" }}>{icon}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</span>
            </div>
            <p style={{ fontSize: 12, fontWeight: 600, color: color || "rgba(255,255,255,0.7)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>
          </div>
        ))}

        {/* PIC */}
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "10px 12px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
            <User size={11} style={{ color: "rgba(255,255,255,0.25)" }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", textTransform: "uppercase" }}>PIC</span>
          </div>
          <button onClick={() => setOpenPicId(openPicId === task.id ? null : task.id)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            {task.picDeliver || "Select"} <ChevronDown size={11} />
          </button>
          {openPicId === task.id && (
            <div style={{ position: "absolute", left: 0, top: "calc(100% + 4px)", width: 130, background: "#161c28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, zIndex: 50, overflow: "hidden", boxShadow: "0 16px 40px rgba(0,0,0,0.5)" }}>
              {driverList.map((d: string) => (
                <button key={d} onClick={() => handlePicUpdate(task.id, d)} style={{ width: "100%", padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>{d}</button>
              ))}
            </div>
          )}
        </div>

        {/* Delivery display */}
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "10px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
            <Clock size={11} style={{ color: "rgba(255,255,255,0.25)" }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Est. Time</span>
          </div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.65)", margin: 0 }}>{fmtDate(task.time)}</p>
        </div>
      </div>

      {/* Schedule picker */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
          <Calendar size={11} style={{ color: "rgba(255,255,255,0.25)" }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Scheduled Delivery</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="datetime-local" value={localDT} min={toLocalDT(new Date())}
            onChange={e => setLocalDT(e.target.value)}
            style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12, padding: "7px 10px", fontFamily: "inherit", boxSizing: "border-box" as any }} />
          <button onClick={() => handleScheduleUpdate(task.id, localDT)}
            style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(56,189,248,0.15)", border: "1px solid rgba(56,189,248,0.25)", color: "#38BDF8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12 }}>
        <div style={{ display: "flex", gap: 14 }}>
          <DocBtn hasFile={task.hasInstallationForm} onView={() => handleViewPdf(task.id, "installation")} onUpload={() => triggerUpload(task.id, "installation")} label="Install" />
          <DocBtn hasFile={task.hasDo} onView={() => handleViewPdf(task.id, "do")} onUpload={() => triggerUpload(task.id, "do")} label="D.Order" />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => handleEditClick(task)} style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.15)", color: "#38BDF8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Edit3 size={14} /></button>
          <button onClick={() => handleDelete(task.id)} style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)", color: "#F87171", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 size={14} /></button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
const AdminLogisticsTable = () => {
  const [tasks, setTasks] = useState<LogisticsTaskDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [openStatusId, setOpenStatusId] = useState<number | null>(null);
  const [openPicId, setOpenPicId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [newTasks, setNewTasks] = useState([{ from: "", companyName: "", location: "", item: "", scheduledTime: "", picDeliver: "" }]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadConfig, setUploadConfig] = useState<{ id: number; type: string } | null>(null);

  const API_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Logistics`;
  const driverList = ["Akmal", "Nahfiz", "Abu"];

  /* ── API FUNCTIONS (all preserved) ── */
  const fetchTasks = async () => {
    try { setLoading(true); const res = await fetch(API_BASE); setTasks(await res.json()); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { fetchTasks(); }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this dispatch? This cannot be undone.")) return;
    try { const r = await fetch(`${API_BASE}/${id}`, { method: "DELETE" }); if (r.ok) fetchTasks(); }
    catch { alert("Delete failed"); }
  };

  const handleEditClick = (t: LogisticsTaskDto) => {
    setEditingTask({ id: t.id, from: t.from, companyName: t.companyName, location: t.location, item: t.item, scheduledTime: t.time, picDeliver: t.picDeliver });
    setIsEditModalOpen(true);
  };

  const handleUpdateTask = async () => {
    try {
      const payload = { ...editingTask, scheduledTime: editingTask.scheduledTime ? new Date(editingTask.scheduledTime).toISOString() : null };
      const r = await fetch(`${API_BASE}/${editingTask.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (r.ok) { setIsEditModalOpen(false); fetchTasks(); }
      else { console.error(await r.text()); alert("Update failed"); }
    } catch { alert("Update failed"); }
  };

  const handleAddRow = () => setNewTasks([...newTasks, { from: "", companyName: "", location: "", item: "", scheduledTime: "", picDeliver: "" }]);
  const handleRemoveRow = (i: number) => setNewTasks(newTasks.filter((_, idx) => idx !== i));
  const handleInputChange = (i: number, field: string, value: string) => {
    const u = [...newTasks]; (u[i] as any)[field] = value; setNewTasks(u);
  };

  const handleSubmitNewTasks = async () => {
    try {
      const r = await fetch(API_BASE, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newTasks) });
      if (r.ok) { setIsModalOpen(false); setNewTasks([{ from: "", companyName: "", location: "", item: "", scheduledTime: "", picDeliver: "" }]); fetchTasks(); }
    } catch (e) { console.error(e); }
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      const r = await fetch(`${API_BASE}/status/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newStatus) });
      if (r.ok) { setOpenStatusId(null); fetchTasks(); }
    } catch (e) { console.error(e); }
  };

  const handlePicUpdate = async (id: number, newPic: string) => {
    try {
      const r = await fetch(`${API_BASE}/pic/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newPic) });
      if (r.ok) { setOpenPicId(null); fetchTasks(); }
    } catch (e) { console.error(e); }
  };

  const handleScheduleUpdate = async (id: number, value: string) => {
    if (!value) return;
    try {
      const r = await fetch(`${API_BASE}/schedule/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(new Date(value).toISOString()) });
      if (r.ok) fetchTasks();
      else { const err = await r.text(); console.error(err); alert("Update failed: " + err); }
    } catch (e) { console.error(e); }
  };

  const handleViewPdf = (id: number, type: string) => window.open(`${API_BASE}/view/${id}/${type}`, "_blank");

  const triggerUpload = (id: number, type: string) => {
    const task = tasks.find(t => t.id === id);
    const has = type === "installation" ? task?.hasInstallationForm : task?.hasDo;
    if (has && !window.confirm(`Overwrite existing ${type} document?`)) return;
    setUploadConfig({ id, type }); fileInputRef.current?.click();
  };

  /* ── SORT HANDLER ── */
  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  /* ── FILTERED + SORTED DATA ── */
  const processedTasks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let filtered = q
      ? tasks.filter(t =>
          t.companyName.toLowerCase().includes(q) ||
          t.from.toLowerCase().includes(q) ||
          t.location.toLowerCase().includes(q) ||
          t.item.toLowerCase().includes(q) ||
          t.picDeliver.toLowerCase().includes(q) ||
          t.status.toLowerCase().includes(q)
        )
      : tasks;

    if (!sortKey) return filtered;

    return [...filtered].sort((a, b) => {
      let av: any = a[sortKey as keyof LogisticsTaskDto] ?? "";
      let bv: any = b[sortKey as keyof LogisticsTaskDto] ?? "";
      if (sortKey === "createdAt" || sortKey === "time" || sortKey === "scheduledAt") {
        av = new Date(av).getTime(); bv = new Date(bv).getTime();
      } else {
        av = String(av).toLowerCase(); bv = String(bv).toLowerCase();
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [tasks, searchQuery, sortKey, sortDir]);

  /* ── STYLES ── */
  const iCls: React.CSSProperties = { width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", outline: "none" };
  const lCls: React.CSSProperties = { display: "block", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 };

  const thBtn = (key: SortKey, label: string, center = false, right = false): React.CSSProperties => ({
    display: "flex", alignItems: "center", justifyContent: center ? "center" : right ? "flex-end" : "flex-start",
    gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0,
    fontSize: 9, fontWeight: 800, color: sortKey === key ? "#38BDF8" : "rgba(255,255,255,0.25)",
    letterSpacing: "0.18em", textTransform: "uppercase", whiteSpace: "nowrap", width: "100%",
  });

  /* ── COLUMN WIDTHS ── */
  const COLS = [
    { key: null,          label: "Docs",         w: 110, center: true },
    { key: "createdAt",   label: "Created",      w: 145 },
    { key: "time",        label: "Estimated",    w: 145 },
    { key: "from",        label: "Origin",       w: 120 },
    { key: "companyName", label: "Customer",     w: 165 },
    { key: "location",    label: "City",         w: 130 },
    { key: "item",        label: "Item",         w: 150 },
    { key: "picDeliver",  label: "PIC",          w: 145 },
    { key: "scheduledAt", label: "Delivery Time",w: 215 },
    { key: "status",      label: "Status",       w: 135, center: true },
    { key: null,          label: "",             w: 85,  right: true },
  ] as const;

  const minW = COLS.reduce((a, c) => a + c.w, 0);

  /* ══ RENDER ══ */
  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }
        .mono { font-family: 'DM Mono', monospace !important; }
        ::-webkit-scrollbar { height: 4px; width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 99px; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.25s ease both; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes pulse { 0%,100%{opacity:0.4}50%{opacity:0.9} }
        .pulse { animation: pulse 1.6s ease infinite; }
        .row-hover:hover { background: rgba(255,255,255,0.022) !important; }
        .row-hover:hover .row-actions { opacity: 1 !important; }
        input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter: invert(0.4); cursor: pointer; }
        input[type="datetime-local"]:focus, input[type="text"]:focus, input[type="search"]:focus { border-color: rgba(56,189,248,0.5) !important; outline: none; }
        .th-sort:hover { color: rgba(255,255,255,0.6) !important; }
        .th-sort:hover svg { opacity: 0.7 !important; }
        .search-clear:hover { background: rgba(255,255,255,0.12) !important; }
        @media (min-width: 1024px) { .desktop-table { display: block !important; } .mobile-cards { display: none !important; } }
        @media (max-width: 1023px) { .desktop-table { display: none !important; } .mobile-cards { display: flex !important; } }
      `}</style>

      {/* Hidden file input */}
      <input type="file" ref={fileInputRef} style={{ display: "none" }} accept=".pdf"
        onChange={async e => {
          if (!e.target.files || !uploadConfig) return;
          const fd = new FormData(); fd.append("file", e.target.files[0]);
          try {
            const r = await fetch(`${API_BASE}/upload/${uploadConfig.id}/${uploadConfig.type}`, { method: "POST", body: fd });
            if (r.ok) fetchTasks(); else alert("Upload failed");
          } catch (err) { console.error(err); }
          finally { e.target.value = ""; setUploadConfig(null); }
        }}
      />

      <div style={{ maxWidth: 1700, margin: "0 auto", padding: "28px 20px 60px" }}>

        {/* ── Page Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Package size={20} style={{ color: "#38BDF8" }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>Logistics Control</h1>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "2px 0 0", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" }}>Fleet & Document Management</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {!loading && tasks.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { label: "Waiting", count: tasks.filter(t => t.status.toUpperCase() === "WAITING").length, color: "#F59E0B" },
                  { label: "Arrange", count: tasks.filter(t => t.status.toUpperCase() === "ARRANGE").length, color: "#38BDF8" },
                ].map(s => (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 99, background: s.color }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.45)" }}>{s.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{s.count}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setIsModalOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#38BDF8", color: "#0d1117", borderRadius: 12, border: "none", fontSize: 13, fontWeight: 800, cursor: "pointer", flexShrink: 0 }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")} onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
              <Plus size={16} /> New Dispatch
            </button>
          </div>
        </div>

        {/* ── Search Bar ── */}
        <div style={{ marginBottom: 20, position: "relative", maxWidth: "100%" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Search size={15} style={{ position: "absolute", left: 14, color: "rgba(255,255,255,0.3)", pointerEvents: "none", flexShrink: 0 }} />
            <input
              type="search"
              placeholder="Search customer, item, origin, city, PIC, status…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "11px 40px 11px 40px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, color: "#fff", fontSize: 13, fontFamily: "inherit", outline: "none", transition: "border-color 0.2s" }}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery("")}
                style={{ position: "absolute", right: 10, width: 24, height: 24, borderRadius: 99, background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.15s" }}>
                <X size={12} />
              </button>
            )}
          </div>
          {searchQuery && (
            <p style={{ margin: "8px 0 0 4px", fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>
              {processedTasks.length} result{processedTasks.length !== 1 ? "s" : ""} for "{searchQuery}"
            </p>
          )}
        </div>

        {/* ── Main Panel ── */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 22, overflow: "hidden", paddingBottom: 20 }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 0", gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: "rgba(56,189,248,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Loader2 size={22} style={{ color: "#38BDF8" }} className="spin" />
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.2)", fontWeight: 500 }} className="pulse">Loading dispatches…</p>
            </div>
          ) : tasks.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 0", gap: 12 }}>
              <div style={{ width: 54, height: 54, borderRadius: 16, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Package size={24} style={{ color: "rgba(255,255,255,0.15)" }} />
              </div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.25)", fontWeight: 500, margin: 0 }}>No dispatches yet</p>
              <button onClick={() => setIsModalOpen(true)} style={{ fontSize: 12, fontWeight: 700, color: "#38BDF8", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Create your first →</button>
            </div>
          ) : processedTasks.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 12 }}>
              <Search size={32} style={{ color: "rgba(255,255,255,0.1)" }} />
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.25)", fontWeight: 500, margin: 0 }}>No results for "{searchQuery}"</p>
              <button onClick={() => setSearchQuery("")} style={{ fontSize: 12, fontWeight: 700, color: "#38BDF8", background: "none", border: "none", cursor: "pointer" }}>Clear search</button>
            </div>
          ) : (
            <>
              {/* ── DESKTOP TABLE ── */}
              <div className="desktop-table" style={{ display: "none" }}>
                <div style={{ overflowX: "auto", paddingBottom: 70 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: minW }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.018)" }}>
                        {COLS.map((col, i) => (
                          <th key={i} style={{ width: col.w, minWidth: col.w, padding: "13px 14px", textAlign: (col as any).center ? "center" : (col as any).right ? "right" : "left" }}>
                            {col.key ? (
                              <button className="th-sort" onClick={() => handleSort(col.key as SortKey)}
                                style={thBtn(col.key as SortKey, col.label, (col as any).center, (col as any).right)}>
                                {col.label}
                                <SortIcon colKey={col.key as SortKey} sortKey={sortKey} sortDir={sortDir} />
                              </button>
                            ) : (
                              <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.22)", letterSpacing: "0.18em", textTransform: "uppercase" }}>{col.label}</span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {processedTasks.map((task) => {
                        const sc = getStatus(task.status);
                        return (
                          <tr key={task.id} className="row-hover" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }}>
                            {/* Docs */}
                            <td style={{ padding: "14px", textAlign: "center" }}>
                              <div style={{ display: "flex", justifyContent: "center", gap: 10}}>
                                <DocBtn hasFile={task.hasInstallationForm} onView={() => handleViewPdf(task.id, "installation")} onUpload={() => triggerUpload(task.id, "installation")} label="Install" />
                                <DocBtn hasFile={task.hasDo} onView={() => handleViewPdf(task.id, "do")} onUpload={() => triggerUpload(task.id, "do")} label="D.Order" />
                              </div>
                            </td>
                            {/* Created */}
                            <td style={{ padding: "14px 14px" }}>
                              <span className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", fontWeight: 400 }}>{fmtDate(task.createdAt)}</span>
                            </td>
                            {/* Estimated */}
                            <td style={{ padding: "14px" }}>
                              <span className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", fontWeight: 400 }}>{fmtDate(task.time)}</span>
                            </td>
                            {/* Origin */}
                            <td style={{ padding: "14px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <span style={{ width: 5, height: 5, borderRadius: 99, background: "rgba(255,255,255,0.15)", flexShrink: 0 }} />
                                <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.42)" }}>{task.from}</span>
                              </div>
                            </td>
                            {/* Customer */}
                            <td style={{ padding: "14px" }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{task.companyName}</span>
                            </td>
                            {/* City */}
                            <td style={{ padding: "14px" }}>
                              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.location)}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                                <MapPin size={11} style={{ color: "#34D399", flexShrink: 0 }} />
                                <span style={{ fontSize: 12, fontWeight: 600, color: "#34D399", textDecoration: "underline", textUnderlineOffset: 2 }}>{task.location}</span>
                              </a>
                            </td>
                            {/* Item */}
                            <td style={{ padding: "14px" }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#38BDF8" }}>{task.item}</span>
                            </td>
                            {/* PIC */}
                            <td style={{ padding: "14px", position: "relative" }}>
                              <button onClick={() => setOpenPicId(openPicId === task.id ? null : task.id)}
                                style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 8, color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                                <User size={10} /> {task.picDeliver || "Assign PIC"} <ChevronDown size={9} />
                              </button>
                              {openPicId === task.id && (
                                <div className="fade-up" style={{ position: "absolute", left: 14, top: "calc(100% - 11px)", width: 130, background: "#161c28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, zIndex: 60, overflow: "hidden", boxShadow: "0 16px 40px rgba(0,0,0,0.5)" }}>
                                  {driverList.map(d => (
                                    <button key={d} onClick={() => handlePicUpdate(task.id, d)}
                                      style={{ width: "100%", padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                                      onMouseLeave={e => (e.currentTarget.style.background = "none")}
                                    >{d}</button>
                                  ))}
                                </div>
                              )}
                            </td>
                            {/* Delivery Time */}
                            <td style={{ padding: "14px" }}>
                              <DeliveryCell task={task} handleScheduleUpdate={handleScheduleUpdate} />
                            </td>
                            {/* Status */}
                            <td style={{ padding: "14px", textAlign: "center", position: "relative" }}>
                              <button onClick={() => setOpenStatusId(openStatusId === task.id ? null : task.id)}
                                style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 99, border: `1px solid ${sc.border}`, background: sc.bg, color: sc.color, fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap" }}>
                                <span style={{ width: 5, height: 5, borderRadius: 99, background: sc.dot }} />
                                {sc.label} <ChevronDown size={9} />
                              </button>
                              {openStatusId === task.id && (
                                <div className="fade-up" style={{ position: "absolute", left: "15%", transform: "translateX(-50%)", top: "calc(100% - 11px)", width: 130, background: "#161c28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, zIndex: 60, overflow: "hidden", boxShadow: "0 16px 40px rgba(0,0,0,0.5)" }}>
                                  {["Waiting", "Arrange"].map(s => (
                                    <button key={s} onClick={() => handleStatusUpdate(task.id, s)}
                                      style={{ width: "100%", padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                                      onMouseLeave={e => (e.currentTarget.style.background = "none")}
                                    >{s}</button>
                                  ))}
                                </div>
                              )}
                            </td>
                            {/* Actions */}
                            <td style={{ padding: "14px" }}>
                              <div className="row-actions" style={{ display: "flex", justifyContent: "flex-end", gap: 4, opacity: 0, transition: "opacity 0.15s" }}>
                                <button onClick={() => handleEditClick(task)} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.15)", color: "#38BDF8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Edit3 size={13} /></button>
                                <button onClick={() => handleDelete(task.id)} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)", color: "#F87171", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 size={13} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── MOBILE CARDS ── */}
              <div className="mobile-cards" style={{ display: "none", flexDirection: "column", gap: 12, padding: 14 }}>
                {processedTasks.map(task => (
                  <MobileCard key={task.id} task={task} driverList={driverList}
                    openStatusId={openStatusId} setOpenStatusId={setOpenStatusId}
                    openPicId={openPicId} setOpenPicId={setOpenPicId}
                    handleStatusUpdate={handleStatusUpdate} handlePicUpdate={handlePicUpdate}
                    handleViewPdf={handleViewPdf} triggerUpload={triggerUpload}
                    handleEditClick={handleEditClick} handleDelete={handleDelete}
                    handleScheduleUpdate={handleScheduleUpdate}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {!loading && tasks.length > 0 && (
          <p style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: "rgba(255,255,255,0.12)", fontWeight: 500 }}>
            {processedTasks.length} of {tasks.length} dispatch{tasks.length !== 1 ? "es" : ""}
            {sortKey && <span style={{ color: "rgba(56,189,248,0.4)", marginLeft: 6 }}>· sorted by {sortKey} {sortDir === "asc" ? "↑" : "↓"}</span>}
          </p>
        )}
      </div>

      {/* ══ EDIT MODAL — CENTERED ══ */}
      {isEditModalOpen && editingTask && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="fade-up" style={{ background: "#131820", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 22, width: "100%", maxWidth: 600, boxShadow: "0 32px 100px rgba(0,0,0,0.6)", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#fff", margin: 0 }}>Edit Dispatch</h3>
                <p className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: "3px 0 0" }}>#{editingTask.id}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={17} /></button>
            </div>
            {/* Body */}
            <div style={{ padding: "22px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxHeight: "65vh", overflowY: "auto" }}>
              {[
                { label: "From", key: "from", span: 2 },
                { label: "Customer Name", key: "companyName", span: 2 },
                { label: "City / Location", key: "location", span: 2 },
                { label: "Deliver PIC", key: "picDeliver", span: 1 },
                { label: "Item", key: "item", span: 1 },
              ].map(({ label, key, span }) => (
                <div key={key} style={{ gridColumn: span === 2 ? "1 / -1" : "auto" }}>
                  <label style={lCls}>{label}</label>
                  <input type="text" style={iCls} value={editingTask[key] ?? ""} onChange={e => setEditingTask({ ...editingTask, [key]: e.target.value })} />
                </div>
              ))}
            </div>
            {/* Footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 10 }}>
              <button onClick={() => setIsEditModalOpen(false)} style={{ flex: 1, padding: "12px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Discard</button>
              <button onClick={handleUpdateTask} style={{ flex: 2, padding: "12px", borderRadius: 10, background: "#38BDF8", border: "none", color: "#0d1117", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ CREATE MODAL — CENTERED ══ */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="fade-up" style={{ background: "#131820", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 22, width: "100%", maxWidth: 860, boxShadow: "0 32px 100px rgba(0,0,0,0.6)", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#fff", margin: 0 }}>New Dispatch</h3>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: "3px 0 0" }}>Schedule item deliveries</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={17} /></button>
            </div>
            {/* Body */}
            <div style={{ padding: 20, maxHeight: "62vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
              {newTasks.map((task, idx) => (
                <div key={idx} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "18px 18px 18px", position: "relative" }}>
                  {newTasks.length > 1 && (
                    <button onClick={() => handleRemoveRow(idx)} style={{ position: "absolute", top: 12, right: 12, width: 28, height: 28, borderRadius: 8, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#F87171", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={13} /></button>
                  )}
                  {newTasks.length > 1 && <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.18)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 14, marginTop: 0 }}>Entry {idx + 1}</p>}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                    {[
                      { label: "From", key: "from", placeholder: "Warehouse / Store" },
                      { label: "Customer", key: "companyName", placeholder: "Company Name" },
                      { label: "City", key: "location", placeholder: "Delivery City" },
                      { label: "Item", key: "item", placeholder: "Item Name" },
                      { label: "In-Charge PIC", key: "picDeliver", placeholder: "PIC Name" },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key}>
                        <label style={lCls}>{label}</label>
                        <input type="text" placeholder={placeholder} style={{ ...iCls, color: "#fff" }} value={(task as any)[key]} onChange={e => handleInputChange(idx, key, e.target.value)} />
                      </div>
                    ))}
                    <div>
                      <label style={lCls}>Estimate Date & Time</label>
                      <input type="datetime-local" style={iCls} value={task.scheduledTime} onChange={e => handleInputChange(idx, "scheduledTime", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={handleAddRow}
                style={{ width: "100%", padding: 13, border: "1.5px dashed rgba(255,255,255,0.1)", borderRadius: 14, background: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(56,189,248,0.3)"; e.currentTarget.style.color = "rgba(56,189,248,0.7)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.2)"; }}>
                <Plus size={15} /> Add Another Entry
              </button>
            </div>
            {/* Footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 10 }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: "12px 20px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSubmitNewTasks} style={{ flex: 1, padding: "12px", borderRadius: 10, background: "#38BDF8", border: "none", color: "#0d1117", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Deploy Dispatch</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── DELIVERY CELL (isolated state to avoid full re-render) ── */
function DeliveryCell({ task, handleScheduleUpdate }: { task: LogisticsTaskDto; handleScheduleUpdate: (id: number, v: string) => void }) {
  const [val, setVal] = useState(task.scheduledAt ? toLocalDT(task.scheduledAt) : "");
  const [saved, setSaved] = useState(false);

  const save = () => {
    handleScheduleUpdate(task.id, val);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <input type="datetime-local" className="mono" value={val} min={toLocalDT(new Date())}
        onChange={e => { setVal(e.target.value); setSaved(false); }}
        style={{ width: 172, fontSize: 11, padding: "6px 9px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontFamily: "inherit", outline: "none" }}
      />
      <button onClick={save} title="Save"
        style={{ width: 28, height: 28, borderRadius: 7, background: saved ? "rgba(52,211,153,0.15)" : "rgba(56,189,248,0.1)", border: `1px solid ${saved ? "rgba(52,211,153,0.3)" : "rgba(56,189,248,0.2)"}`, color: saved ? "#34D399" : "#38BDF8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.2s" }}>
        {saved
          ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
        }
      </button>
    </div>
  );
}

export default AdminLogisticsTable;