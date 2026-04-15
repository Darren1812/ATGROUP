"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileUp, FileCheck, ChevronDown, Package,
  Loader2, Plus, X, Trash2, Edit3, Calendar,
  MapPin, Truck, User, Clock,
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

/* ─────────────────────────────────────────
   STATUS CONFIG
───────────────────────────────────────── */
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  WAITING: { label: "Waiting",  color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)",  dot: "#F59E0B" },
  ARRANGE: { label: "Arrange",  color: "#38BDF8", bg: "rgba(56,189,248,0.1)",  border: "rgba(56,189,248,0.25)",  dot: "#38BDF8" },
};
const getStatus = (s: string) => STATUS_CFG[s?.toUpperCase()] ?? STATUS_CFG.WAITING;

const toLocalDT = (d: string | Date) => {
  const dt = new Date(d);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${p(dt.getMonth()+1)}-${p(dt.getDate())}T${p(dt.getHours())}:${p(dt.getMinutes())}`;
};
const fmtDate = (d: string) =>
  new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true });

/* ─────────────────────────────────────────
   DOCUMENT BUTTON
───────────────────────────────────────── */
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
      <button
        onClick={() => hasFile ? setOpen(!open) : onUpload()}
        title={label}
        style={{
          width: 36, height: 36, borderRadius: 10, border: hasFile ? "1px solid rgba(52,211,153,0.3)" : "1.5px dashed rgba(255,255,255,0.12)",
          background: hasFile ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.03)",
          color: hasFile ? "#34D399" : "rgba(255,255,255,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all 0.15s", position: "relative",
        }}
      >
        {hasFile ? <FileCheck size={15} /> : <Plus size={14} />}
        {hasFile && <span style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, borderRadius: 99, background: "#34D399", border: "2px solid #0d1117" }} />}
      </button>
      <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.2)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</span>

      {open && hasFile && (
        <div style={{ position: "absolute",   top: "calc(100% + 6px)", left: "160%", transform: "translateX(-50%)", width: 140, background: "#161c28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, boxShadow: "0 16px 40px rgba(0,0,0,0.5)", zIndex: 100, overflow: "hidden" }}>
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

/* ─────────────────────────────────────────
   MOBILE CARD
───────────────────────────────────────── */
function MobileCard({
  task, driverList,
  openStatusId, setOpenStatusId,
  openPicId, setOpenPicId,
  handleStatusUpdate, handlePicUpdate,
  handleViewPdf, triggerUpload,
  handleEditClick, handleDelete,
  handleScheduleUpdate, toLocalDT,
}: any) {
  const sc = getStatus(task.status);
  return (
    <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Top: Company + Status */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.companyName}</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.location}</p>
        </div>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={() => setOpenStatusId(openStatusId === task.id ? null : task.id)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 99, border: `1px solid ${sc.border}`, background: sc.bg, color: sc.color, fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}
          >
            <span style={{ width: 6, height: 6, borderRadius: 99, background: sc.dot }} />
            {sc.label}
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
          { icon: <Truck size={12} />, label: "Item", value: task.item, color: "#38BDF8" },
          { icon: <MapPin size={12} />, label: "From", value: task.from },
        ].map(({ icon, label, value, color }) => (
          <div key={label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
              <span style={{ color: "rgba(255,255,255,0.25)" }}>{icon}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</span>
            </div>
            <p style={{ fontSize: 12, fontWeight: 600, color: color || "rgba(255,255,255,0.7)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>
          </div>
        ))}

        {/* PIC dropdown */}
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "10px 12px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
            <User size={12} style={{ color: "rgba(255,255,255,0.25)" }} />
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

        {/* Schedule */}
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "10px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
            <Clock size={12} style={{ color: "rgba(255,255,255,0.25)" }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Delivery</span>
          </div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.65)", margin: 0 }}>{fmtDate(task.time)}</p>
        </div>
      </div>

{/* Schedule picker (Mobile Version) */}
<div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "10px 12px" }}>
  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
    <Calendar size={12} style={{ color: "rgba(255,255,255,0.25)" }} />
    <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
      Scheduled Delivery Time
    </span>
  </div>

  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    <input
      id={`dt-mobile-${task.id}`}
      type="datetime-local"
      defaultValue={task.scheduledAt ? toLocalDT(task.scheduledAt) : ""}
      min={toLocalDT(new Date())}
      style={{ 
        flex: 1, // Let it take available space
        background: "rgba(255,255,255,0.05)", 
        border: "1px solid rgba(255,255,255,0.1)", 
        borderRadius: 8, 
        color: "#fff", 
        fontSize: 12, 
        padding: "6px 10px", 
        fontFamily: "inherit", 
        boxSizing: "border-box" 
      }}
    />

    <button
      onClick={() => {
        const input = document.getElementById(`dt-mobile-${task.id}`) as HTMLInputElement;
        handleScheduleUpdate(task.id, input.value);
      }}
      style={{
        background: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "8px",
        padding: "6px 10px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        transition: "all 0.2s"
      }}
      onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
      onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 4v6h-6"></path>
        <path d="M1 20v-6h6"></path>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
      </svg>
    </button>
  </div>
</div>
      {/* Footer: docs + actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12, paddingBottom: 50}}>
        <div style={{ display: "flex", gap: 16 }}>
          <DocBtn hasFile={task.hasInstallationForm} onView={() => handleViewPdf(task.id, "installation")} onUpload={() => triggerUpload(task.id, "installation")} label="Install" />
          <DocBtn hasFile={task.hasDo} onView={() => handleViewPdf(task.id, "do")} onUpload={() => triggerUpload(task.id, "do")} label="D.Order" />
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => handleEditClick(task)} style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.15)", color: "#38BDF8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Edit3 size={14} />
          </button>
          <button onClick={() => handleDelete(task.id)} style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)", color: "#F87171", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const AdminLogisticsTable = () => {
  const [tasks, setTasks] = useState<LogisticsTaskDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [openStatusId, setOpenStatusId] = useState<number | null>(null);
  const [openPicId, setOpenPicId] = useState<number | null>(null);
  const [newTasks, setNewTasks] = useState([{ from: "", companyName: "", location: "", item: "", scheduledTime: "", picDeliver: "" }]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadConfig, setUploadConfig] = useState<{ id: number; type: string } | null>(null);

  const API_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Logistics`;
  const driverList = ["Akmal", "Nahfiz", "Abu"];

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
      const r = await fetch(`${API_BASE}/schedule/${id}`, { 
        method: "PATCH", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(new Date(value).toISOString()) 
      });
      
      if (r.ok) {
        fetchTasks(); // Refresh list to confirm change
      } else { 
        const err = await r.text();
        console.error(err); 
        alert("Update failed: " + err); 
      }
    } catch (e) { 
      console.error(e); 
    }
  };
  const handleViewPdf = (id: number, type: string) => window.open(`${API_BASE}/view/${id}/${type}`, "_blank");

  const triggerUpload = (id: number, type: string) => {
    const task = tasks.find(t => t.id === id);
    const has = type === "installation" ? task?.hasInstallationForm : task?.hasDo;
    if (has && !window.confirm(`Overwrite existing ${type} document?`)) return;
    setUploadConfig({ id, type }); fileInputRef.current?.click();
  };

  /* Shared input/label styles */
  const iCls: React.CSSProperties = { width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", outline: "none" };
  const lCls: React.CSSProperties = { display: "block", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 };

  /* Table column definitions — drives both header and cell rendering */
  const COLS = [
    { key: "docs",      label: "Docs",          width: 110, center: true },
    { key: "created",   label: "Created",        width: 130 },
    { key: "estimated", label: "Estimated",      width: 130 },
    { key: "origin",    label: "Origin",         width: 120 },
    { key: "customer",  label: "Customer",       width: 160 },
    { key: "city",      label: "City",           width: 120 },
    { key: "item",      label: "Item",           width: 150 },
    { key: "pic",       label: "PIC",            width: 140 },
    { key: "delivery",  label: "Delivery Time",  width: 200 },
    { key: "status",    label: "Status",         width: 130, center: true },
    { key: "actions",   label: "",               width: 80,  right: true },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .mono { font-family: 'DM Mono', monospace !important; }
        ::-webkit-scrollbar { height: 4px; width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 99px; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.3s ease both; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes pulse { 0%,100%{opacity:0.4}50%{opacity:0.9} }
        .pulse { animation: pulse 1.6s ease infinite; }
        .row-hover:hover { background: rgba(255,255,255,0.022) !important; }
        input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter: invert(0.4); cursor: pointer; }
        input[type="datetime-local"]:focus { border-color: rgba(56,189,248,0.4) !important; outline: none; }
        input[type="text"]:focus, input[type="text"]:focus { border-color: rgba(56,189,248,0.4) !important; outline: none; }
        .modal-input:focus { border-color: rgba(56,189,248,0.4) !important; }
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

      <div style={{ maxWidth: 1600, margin: "0 auto", padding: "32px 20px 60px" }}>

        {/* ── Page Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Package size={22} style={{ color: "#38BDF8" }} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>Logistics Control</h1>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "3px 0 0", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" }}>Fleet & Document Management</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {!loading && tasks.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { label: "Waiting", count: tasks.filter(t => t.status.toUpperCase() === "WAITING").length, color: "#F59E0B" },
                  { label: "Arrange", count: tasks.filter(t => t.status.toUpperCase() === "ARRANGE").length, color: "#38BDF8" },
                ].map(s => (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 99, background: s.color }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>{s.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{s.count}</span>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setIsModalOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 20px", background: "#38BDF8", color: "#0d1117", borderRadius: 12, border: "none", fontSize: 13, fontWeight: 800, cursor: "pointer", letterSpacing: "0.02em", flexShrink: 0, transition: "opacity 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              <Plus size={16} /> New Dispatch
            </button>
          </div>
        </div>

        {/* ── Main Panel ── */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 24, overflow: "hidden" }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 0", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(56,189,248,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Loader2 size={24} style={{ color: "#38BDF8" }} className="spin" />
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.2)", fontWeight: 500 }} className="pulse">Loading dispatches…</p>
            </div>
          ) : tasks.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 0", gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Package size={26} style={{ color: "rgba(255,255,255,0.15)" }} />
              </div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.25)", fontWeight: 500, margin: 0 }}>No dispatches yet</p>
              <button onClick={() => setIsModalOpen(true)} style={{ fontSize: 12, fontWeight: 700, color: "#38BDF8", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Create your first →</button>
            </div>
          ) : (
            <>
              {/* ── Desktop Table ── */}
              <div style={{ display: "none" }} className="desktop-table">
                <div style={{ overflowX: "auto", paddingBottom: 60 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: COLS.reduce((a, c) => a + c.width, 0) }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        {COLS.map(col => (
                          <th key={col.key} style={{
                            width: col.width, minWidth: col.width,
                            padding: "14px 16px",
                            fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.22)",
                            letterSpacing: "0.18em", textTransform: "uppercase",
                            textAlign: col.center ? "center" : col.right ? "right" : "left",
                            whiteSpace: "nowrap", background: "rgba(255,255,255,0.015)",
                          }}>{col.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task) => {
                        const sc = getStatus(task.status);
                        return (
                          <tr key={task.id} className="row-hover" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }}>

                            {/* Docs */}
                            <td style={{ padding: "16px", textAlign: "center" }}>
                              <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                                <DocBtn hasFile={task.hasInstallationForm} onView={() => handleViewPdf(task.id, "installation")} onUpload={() => triggerUpload(task.id, "installation")} label="Install" />
                                <DocBtn hasFile={task.hasDo} onView={() => handleViewPdf(task.id, "do")} onUpload={() => triggerUpload(task.id, "do")} label="D.Order" />
                              </div>
                            </td>

                            {/* Created */}
                            <td style={{ padding: "16px" }}>
                              <span className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>{fmtDate(task.createdAt)}</span>
                            </td>

                            {/* Estimated */}
                            <td style={{ padding: "16px" }}>
                              <span className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 400 }}>{fmtDate(task.time)}</span>
                            </td>

                            {/* Origin */}
                            <td style={{ padding: "16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{ width: 6, height: 6, borderRadius: 99, background: "rgba(255,255,255,0.15)", flexShrink: 0 }} />
                                <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>{task.from}</span>
                              </div>
                            </td>

                            {/* Customer */}
                            <td style={{ padding: "16px" }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{task.companyName}</span>
                            </td>

                            {/* City */}
                            <td style={{ padding: "16px" }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>{task.location}</span>
                            </td>

                            {/* Item */}
                            <td style={{ padding: "16px" }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#38BDF8" }}>{task.item}</span>
                            </td>

                            {/* PIC */}
                            <td style={{ padding: "16px", position: "relative" }}>
                              <button
                                onClick={() => setOpenPicId(openPicId === task.id ? null : task.id)}
                                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s" }}
                              >
                                <User size={11} /> {task.picDeliver || "Assign PIC"} <ChevronDown size={10} />
                              </button>
                              {openPicId === task.id && (
                                <div className="fade-up" style={{ position: "absolute", left: 16, top: "calc(100% - 4px)", width: 130, background: "#161c28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, zIndex: 50, overflow: "hidden", boxShadow: "0 16px 40px rgba(0,0,0,0.5)" }}>
                                  {driverList.map(d => (
                                    <button key={d} onClick={() => handlePicUpdate(task.id, d)} style={{ width: "100%", padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", background: "none", border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.1s" }}
                                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                                      onMouseLeave={e => (e.currentTarget.style.background = "none")}
                                    >{d}</button>
                                  ))}
                                </div>
                              )}
                            </td>

                            {/* Delivery Time (editable) */}
                            <td style={{ padding: "16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <input
                                  id={`dt-${task.id}`}
                                  type="datetime-local"
                                  className="mono"
                                  defaultValue={task.scheduledAt ? toLocalDT(task.scheduledAt) : ""}
                                  min={toLocalDT(new Date())}
                                  style={{ 
                                    ...iCls, 
                                    width: 180, 
                                    fontSize: 11, 
                                    padding: "7px 10px", 
                                    borderRadius: 8,
                                    border: "1px solid #ddd" 
                                  }}
                                />
                                
                                <button
                                  onClick={() => {
                                    const input = document.getElementById(`dt-${task.id}`) as HTMLInputElement;
                                    handleScheduleUpdate(task.id, input.value);
                                  }}
                                  title="Update Schedule"
                                  style={{
                                    background: "#f0f0f0",
                                    border: "1px solid #ccc",
                                    borderRadius: "6px",
                                    padding: "5px 8px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.2s"
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.background = "#e0e0e0"}
                                  onMouseOut={(e) => e.currentTarget.style.background = "#f0f0f0"}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 4v6h-6"></path>
                                    <path d="M1 20v-6h6"></path>
                                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                                  </svg>
                                </button>
                              </div>
                            </td>
                            {/* Status */}
                            <td style={{ padding: "16px", textAlign: "center", position: "relative" }}>
                              <button
                                onClick={() => setOpenStatusId(openStatusId === task.id ? null : task.id)}
                                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 99, border: `1px solid ${sc.border}`, background: sc.bg, color: sc.color, fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap" }}
                              >
                                <span style={{ width: 6, height: 6, borderRadius: 99, background: sc.dot }} />
                                {sc.label} <ChevronDown size={9} />
                              </button>
                              {openStatusId === task.id && (
                                <div className="fade-up" style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: "calc(100% - 4px)", width: 130, background: "#161c28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, zIndex: 50, overflow: "hidden", boxShadow: "0 16px 40px rgba(0,0,0,0.5)" }}>
                                  {["Waiting", "Arrange"].map(s => (
                                    <button key={s} onClick={() => handleStatusUpdate(task.id, s)} style={{ width: "100%", padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                                      onMouseLeave={e => (e.currentTarget.style.background = "none")}
                                    >{s}</button>
                                  ))}
                                </div>
                              )}
                            </td>

                            {/* Actions */}
                            <td style={{ padding: "16px", textAlign: "right" }}>
                              <div style={{ display: "flex", justifyContent: "flex-end", gap: 4, opacity: 0 }} className="row-actions">
                                <button onClick={() => handleEditClick(task)} style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.15)", color: "#38BDF8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Edit3 size={13} /></button>
                                <button onClick={() => handleDelete(task.id)} style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)", color: "#F87171", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 size={13} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Mobile Cards ── */}
              <div className="mobile-cards" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                {tasks.map(task => (
                  <MobileCard key={task.id} task={task} driverList={driverList}
                    openStatusId={openStatusId} setOpenStatusId={setOpenStatusId}
                    openPicId={openPicId} setOpenPicId={setOpenPicId}
                    handleStatusUpdate={handleStatusUpdate} handlePicUpdate={handlePicUpdate}
                    handleViewPdf={handleViewPdf} triggerUpload={triggerUpload}
                    handleEditClick={handleEditClick} handleDelete={handleDelete}
                    handleScheduleUpdate={handleScheduleUpdate} toLocalDT={toLocalDT}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {!loading && tasks.length > 0 && (
          <p style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "rgba(255,255,255,0.12)", fontWeight: 500 }}>
            {tasks.length} dispatch{tasks.length !== 1 ? "es" : ""} total
          </p>
        )}
      </div>

      {/* Responsive switcher */}
      <style>{`
        @media (min-width: 1024px) {
          .desktop-table { display: block !important; }
          .mobile-cards { display: none !important; }
        }
        .row-hover:hover .row-actions { opacity: 1 !important; }
      `}</style>

      {/* ── EDIT MODAL ── */}
      {isEditModalOpen && editingTask && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", zIndex: 999, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 0 }}
          className="sm-center">
          <div className="fade-up" style={{ background: "#131820", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 640, boxShadow: "0 -24px 80px rgba(0,0,0,0.5)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#fff", margin: 0 }}>Edit Dispatch</h3>
                <p className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: "3px 0 0" }}>#{editingTask.id}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={17} /></button>
            </div>
            <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxHeight: "60vh", overflowY: "auto" }}>
              {[
                { label: "From", key: "from", span: 2 },
                { label: "Customer Name", key: "companyName", span: 2 },
                { label: "City / Location", key: "location", span: 2 },
                { label: "Deliver PIC", key: "picDeliver", span: 2 },
                { label: "Item", key: "item", span: 1 },
              ].map(({ label, key, span }) => (
                <div key={key} style={{ gridColumn: span === 2 ? "1 / -1" : "auto" }}>
                  <label style={lCls}>{label}</label>
                  <input className="modal-input" type="text" style={iCls} value={editingTask[key] ?? ""} onChange={e => setEditingTask({ ...editingTask, [key]: e.target.value })} />
                </div>
              ))}
              <div>
                <label style={lCls}>Estimated Time</label>
                <input className="modal-input" type="datetime-local" style={iCls} value={editingTask.scheduledTime ?? ""} min={new Date().toISOString().slice(0, 16)} onChange={e => setEditingTask({ ...editingTask, scheduledTime: e.target.value })} />
              </div>
            </div>
            <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 10 }}>
              <button onClick={() => setIsEditModalOpen(false)} style={{ flex: 1, padding: "12px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Discard</button>
              <button onClick={handleUpdateTask} style={{ flex: 2, padding: "12px", borderRadius: 10, background: "#38BDF8", border: "none", color: "#0d1117", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE MODAL ── */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", zIndex: 999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div className="fade-up" style={{ background: "#131820", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 900, boxShadow: "0 -24px 80px rgba(0,0,0,0.5)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#fff", margin: 0 }}>New Dispatch</h3>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: "3px 0 0" }}>Schedule item deliveries</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={17} /></button>
            </div>

            <div style={{ padding: 20, maxHeight: "58vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
              {newTasks.map((task, idx) => (
                <div key={idx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 18, position: "relative" }}>
                  {newTasks.length > 1 && (
                    <button onClick={() => handleRemoveRow(idx)} style={{ position: "absolute", top: 12, right: 12, width: 28, height: 28, borderRadius: 8, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#F87171", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={13} /></button>
                  )}
                  {newTasks.length > 1 && <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.2)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 14 }}>Entry {idx + 1}</p>}
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
                        <input className="modal-input" type="text" placeholder={placeholder} style={{ ...iCls, "::placeholder": { color: "rgba(255,255,255,0.2)" } } as any}
                          value={(task as any)[key]} onChange={e => handleInputChange(idx, key, e.target.value)} />
                      </div>
                    ))}
                    <div>
                      <label style={lCls}>Estimate Date & Time</label>
                      <input className="modal-input" type="datetime-local" style={iCls} value={task.scheduledTime} onChange={e => handleInputChange(idx, "scheduledTime", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}

              <button onClick={handleAddRow} style={{ width: "100%", padding: 14, border: "1.5px dashed rgba(255,255,255,0.1)", borderRadius: 14, background: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, letterSpacing: "0.1em", textTransform: "uppercase", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(56,189,248,0.3)"; e.currentTarget.style.color = "rgba(56,189,248,0.7)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.2)"; }}>
            <Plus size={15} /> Add Another Entry
          </button>
        </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 10 }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: "12px 20px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSubmitNewTasks} style={{ flex: 1, padding: "12px", borderRadius: 10, background: "#38BDF8", border: "none", color: "#0d1117", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Deploy Dispatch</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogisticsTable;