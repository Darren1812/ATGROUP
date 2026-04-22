"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API = "http://localhost:5000/api/Logistics";

const FIELD_CONFIG = [
  { key: "from",          label: "From / Sender",      placeholder: "Who is sending this?",    type: "text",           icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" },
  { key: "companyName",   label: "Company",             placeholder: "Company name",             type: "text",           icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H3m16 0h2M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 00-1-1h-2a1 1 0 00-1 1v5m4 0H9" },
  { key: "location",      label: "Destination",         placeholder: "Delivery location",        type: "text",           icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" },
  { key: "item",          label: "Item / Cargo",        placeholder: "What is being delivered?", type: "textarea",           icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { key: "scheduledTime", label: "Scheduled Time",      placeholder: "",                         type: "datetime-local", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { key: "picDeliver",    label: "Person In Charge",    placeholder: "Responsible person",       type: "text",           icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
];

export default function EditPage() {
  const { id } = useParams();
  const router = useRouter();

  const [task, setTask] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchTask = async () => {
    const res = await fetch(`${API}/${id}`);
    setTask(await res.json());
  };

  useEffect(() => { fetchTask(); }, []);

  const updateTask = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });
      if (r.ok) {
        setSaved(true);
        setTimeout(() => { router.push("/page2"); }, 900);
      }
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  if (!task) return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#f8f9fb", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "#9ca3af" }}>
        <div style={{ width: 20, height: 20, border: "2.5px solid #e5e7eb", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ fontSize: 14 }}>Loading task…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", minHeight: "100vh", background: "#f8f9fb" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .field-input { width: 100%; border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 11px 14px 11px 42px; font-size: 14px; color: #1f2937; background: white; transition: all 0.15s; font-family: inherit; outline: none; }
        .field-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .field-input:hover:not(:focus) { border-color: #d1d5db; }
        .field-wrap { position: relative; }
        .field-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); pointer-events: none; color: #9ca3af; transition: color 0.15s; }
        .field-wrap:focus-within .field-icon { color: #6366f1; }
        .btn-save { background: #4f46e5; color: white; border: none; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; font-family: inherit; }
        .btn-save:hover:not(:disabled) { background: #4338ca; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(79,70,229,0.35); }
        .btn-save:disabled { opacity: 0.7; cursor: not-allowed; }
        .btn-back { background: white; color: #374151; border: 1.5px solid #e5e7eb; padding: 11px 20px; border-radius: 10px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.15s; display: inline-flex; align-items: center; gap: 7px; font-family: inherit; }
        .btn-back:hover { background: #f9fafb; border-color: #d1d5db; }
        .success-check { animation: popIn 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes popIn { from { transform: scale(0); } to { transform: scale(1); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 32px", height: 64, display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn-back" onClick={() => router.push("/page2")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back
          </button>
          <div style={{ width: 1, height: 22, background: "#e5e7eb" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 28, height: 28, background: "#4f46e5", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
            <span style={{ fontSize: 15.5, fontWeight: 600, color: "#111827" }}>Edit Task</span>
            <span style={{ fontSize: 13, color: "#9ca3af", fontFamily: "'DM Mono', monospace" }}>#{id}</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "32px auto", padding: "0 32px" }}>

        {/* Task info card */}
        {task.companyName && (
          <div style={{ background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)", border: "1px solid #c7d2fe", borderRadius: 12, padding: "14px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, background: "white", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(99,102,241,0.15)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round">
                <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#312e81" }}>{task.companyName}</div>
              <div style={{ fontSize: 12.5, color: "#6366f1", marginTop: 1 }}>{task.item} → {task.location}</div>
            </div>
          </div>
        )}

        {/* Form */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6" }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Task Details</h2>
            <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 2 }}>Update the information below and save your changes.</p>
          </div>

          <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            {FIELD_CONFIG.map(({ key, label, placeholder, type, icon }) => (
              <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: (key === "item" || key === "scheduledTime") ? "1 / -1" : "auto" }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", letterSpacing: "0.01em" }}>{label}</label>
                <div className="field-wrap">
                  <svg className="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {icon.includes("M") && icon.split("M").filter(Boolean).map((d, i) => (
                      <path key={i} d={"M" + d} />
                    ))}
                  </svg>
                    {type === "textarea" ? (
                    <textarea
                        className="field-input"
                        placeholder={placeholder}
                        value={task[key] || ""}
                        onChange={(e) => setTask({ ...task, [key]: e.target.value })}
                        rows={4}
                        style={{ resize: "vertical", paddingLeft: 42 }}
                    />
                    ) : (
                    <input
                        type={type}
                        className="field-input"
                        placeholder={placeholder}
                        value={type === "datetime-local" ? formatDate(task[key]) : (task[key] || "")}
                        onChange={(e) => setTask({ ...task, [key]: e.target.value })}
                    />
                    )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: "18px 24px", borderTop: "1px solid #f3f4f6", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 12.5, color: "#9ca3af" }}>All fields are optional except Company and Location.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-back" onClick={() => router.push("/page2")}>Discard</button>
              <button className="btn-save" onClick={updateTask} disabled={saving || saved}>
                {saved ? (
                  <>
                    <svg className="success-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                    Saved!
                  </>
                ) : saving ? (
                  <>
                    <div style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    Saving…
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8"/></svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function formatDate(dateString: string) {
  if (!dateString) return "";
  return new Date(dateString).toISOString().slice(0, 16);
}