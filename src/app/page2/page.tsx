"use client";

import React, { useState, useEffect, useRef } from 'react';
import {FileUp, FileCheck,ChevronDown, Package, Loader2, Plus, X, Trash2,Edit3} from 'lucide-react';

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
}

const AdminLogisticsTable = () => {
    const [tasks, setTasks] = useState<LogisticsTaskDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);
    const [openStatusId, setOpenStatusId] = useState<number | null>(null);

    const [newTasks, setNewTasks] = useState([
        { from: '', companyName: '', location: '', item: '', scheduledTime: '', picDeliver: '' }
    ]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadConfig, setUploadConfig] = useState<{ id: number; type: string } | null>(null);

    const API_BASE = "http://192.168.1.200:5000/api/Logistics";

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const res = await fetch(API_BASE);
            const data = await res.json();
            setTasks(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTasks(); }, []);

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this dispatch? This action cannot be undone.")) return;
        try {
            const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
            if (res.ok) fetchTasks();
        } catch (error) {
            alert("Delete failed");
        }
    };

    const handleEditClick = (task: LogisticsTaskDto) => {
        setEditingTask({
            id: task.id,
            from: task.from,
            companyName: task.companyName,
            location: task.location,
            item: task.item,
            scheduledTime: task.time,
            picDeliver: task.picDeliver
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateTask = async () => {
        try {
            const payload = {
                ...editingTask,
                scheduledTime: editingTask.scheduledTime ? new Date(editingTask.scheduledTime).toISOString() : null
            };
            const res = await fetch(`${API_BASE}/${editingTask.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setIsEditModalOpen(false);
                fetchTasks();
            } else {
                const errorText = await res.text();
                console.error("Server responded with error:", errorText);
                alert("Update failed: Check console for details");
            }
        } catch (error) {
            alert("Update failed");
        }
    };

    const handleAddRow = () => setNewTasks([...newTasks, { from: '', companyName: '', location: '', item: '', scheduledTime: '', picDeliver: '' }]);
    const handleRemoveRow = (index: number) => setNewTasks(newTasks.filter((_, i) => i !== index));
    const handleInputChange = (index: number, field: string, value: string) => {
        const updated = [...newTasks];
        (updated[index] as any)[field] = value;
        setNewTasks(updated);
    };

    const handleSubmitNewTasks = async () => {
        try {
            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTasks)
            });
            if (res.ok) {
                setIsModalOpen(false);
                setNewTasks([{ from: '', companyName: '', location: '', item: '', scheduledTime: '', picDeliver: '' }]);
                fetchTasks();
            }
        } catch (error) { console.error(error); }
    };

    const handleStatusUpdate = async (id: number, newStatus: string) => {
        try {
            const res = await fetch(`${API_BASE}/status/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStatus)
            });
            if (res.ok) { setOpenStatusId(null); fetchTasks(); }
        } catch (error) { console.error(error); }
    };

    const handleViewPdf = (id: number, type: string) => {
        window.open(`${API_BASE}/view/${id}/${type}`, '_blank');
    };

    const triggerUpload = (id: number, type: string) => {
        const task = tasks.find(t => t.id === id);
        const hasExisting = type === 'installation' ? task?.hasInstallationForm : task?.hasDo;
        if (hasExisting) {
            if (!window.confirm(`This task already has an ${type} document. Do you want to overwrite it?`)) return;
        }
        setUploadConfig({ id, type });
        fileInputRef.current?.click();
    };

    const statusConfig: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
        "WAITING":    { label: "Waiting",    dot: "bg-amber-400",   bg: "bg-amber-400/10",  text: "text-amber-400",  border: "border-amber-400/20" },
        "IN TRANSIT": { label: "In Transit", dot: "bg-sky-400",     bg: "bg-sky-400/10",    text: "text-sky-400",    border: "border-sky-400/20" },
        "COMPLETED":  { label: "Completed",  dot: "bg-emerald-400", bg: "bg-emerald-400/10",text: "text-emerald-400",border: "border-emerald-400/20" },
        "CANCELLED":  { label: "Cancelled",  dot: "bg-rose-400",    bg: "bg-rose-400/10",   text: "text-rose-400",   border: "border-rose-400/20" },
    };

    const getStatusConfig = (status: string) => statusConfig[status.toUpperCase()] ?? statusConfig["WAITING"];

    const DocumentItem = ({hasFile, onView, onUpload, label }: any) => {
        const [showMenu, setShowMenu] = React.useState(false);
        const menuRef = React.useRef<HTMLDivElement>(null);
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowMenu(false);
            };
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }, []);

        return (
            <div className="relative flex flex-col items-center" ref={menuRef}>
                <button
                    onClick={() => hasFile ? setShowMenu(!showMenu) : onUpload()}
                    title={label}
                    className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                        hasFile
                            ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                            : 'bg-white/5 text-white/20 border border-dashed border-white/10 hover:border-white/30 hover:text-white/40'
                    }`}
                >
                    {hasFile ? <FileCheck size={15} /> : <Plus size={15} />}
                    {hasFile && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full" />}
                </button>
                <span className="text-[8px] font-bold text-white/25 mt-1 uppercase tracking-widest">{label}</span>

                {showMenu && hasFile && (
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-36 bg-[#1a1f2e] rounded-2xl shadow-2xl border border-white/10 z-50 overflow-hidden">
                        <button onClick={() => { onView(); setShowMenu(false); }} className="w-full px-4 py-3 text-[11px] font-semibold text-white/70 hover:bg-white/5 border-b border-white/5 flex items-center gap-2 transition-colors">
                            <FileUp size={13} className="text-emerald-400" /> View PDF
                        </button>
                        <button onClick={() => { onUpload(); setShowMenu(false); }} className="w-full px-4 py-3 text-[11px] font-semibold text-sky-400 hover:bg-white/5 flex items-center gap-2 transition-colors">
                            <Edit3 size={13} /> Replace
                        </button>
                    </div>
                )}
            </div>
        );
    };

    /* ── Mobile Card ── */
    const MobileCard = ({ task }: { task: LogisticsTaskDto }) => {
        const sc = getStatusConfig(task.status);
        return (
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{task.companyName}</p>
                        <p className="text-white/40 text-xs mt-0.5 truncate">{task.location}</p>
                    </div>
                    <div className="relative flex-shrink-0">
                        <button
                            onClick={() => setOpenStatusId(openStatusId === task.id ? null : task.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${sc.bg} ${sc.text} ${sc.border}`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {sc.label}
                        </button>
                        {openStatusId === task.id && (
                            <div className="absolute right-0 mt-2 w-36 bg-[#1a1f2e] border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden">
                                {["Waiting", "In Transit", "Completed", "Cancelled"].map(s => (
                                    <button key={s} onClick={() => handleStatusUpdate(task.id, s)} className="w-full px-4 py-2.5 text-[11px] font-semibold text-white/60 hover:bg-white/5 text-left transition-colors">{s}</button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white/[0.03] rounded-xl px-3 py-2">
                        <p className="text-white/30 text-[9px] uppercase tracking-widest mb-0.5">Machine</p>
                        <p className="text-sky-400 font-semibold truncate">{task.item}</p>
                    </div>
                    <div className="bg-white/[0.03] rounded-xl px-3 py-2">
                        <p className="text-white/30 text-[9px] uppercase tracking-widest mb-0.5">From</p>
                        <p className="text-white/70 font-semibold truncate">{task.from}</p>
                    </div>
                    <div className="bg-white/[0.03] rounded-xl px-3 py-2">
                        <p className="text-white/30 text-[9px] uppercase tracking-widest mb-0.5">PIC</p>
                        <p className="text-white/70 font-semibold truncate">{task.picDeliver}</p>
                    </div>
                    <div className="bg-white/[0.03] rounded-xl px-3 py-2">
                        <p className="text-white/30 text-[9px] uppercase tracking-widest mb-0.5">Schedule</p>
                        <p className="text-white/70 font-semibold">{new Date(task.time).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit', hour12:true })}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <div className="flex gap-3">
                        <DocumentItem task={task} type="installation" hasFile={task.hasInstallationForm} onView={() => handleViewPdf(task.id,'installation')} onUpload={() => triggerUpload(task.id,'installation')} label="Install" />
                        <DocumentItem task={task} type="do" hasFile={task.hasDo} onView={() => handleViewPdf(task.id,'do')} onUpload={() => triggerUpload(task.id,'do')} label="D.Order" />
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => handleEditClick(task)} className="p-2 rounded-xl text-white/30 hover:text-sky-400 hover:bg-sky-400/10 transition-all">
                            <Edit3 size={16} />
                        </button>
                        <button onClick={() => handleDelete(task.id)} className="p-2 rounded-xl text-white/30 hover:text-rose-400 hover:bg-rose-400/10 transition-all">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    /* ── Input field helper ── */
    const inputCls = "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium placeholder:text-white/20 focus:outline-none focus:border-sky-500/50 focus:bg-white/8 transition-all";
    const labelCls = "block text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] mb-2";

    return (
        <div className="min-h-screen bg-[#0d1117] font-sans">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
                * { font-family: 'DM Sans', sans-serif; }
                .mono { font-family: 'DM Mono', monospace; }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                .fade-up { animation: fadeUp 0.35s ease forwards; }
                @keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.8} }
                .shimmer { animation: shimmer 1.8s ease infinite; }
            `}</style>

            {/* Hidden file input */}
            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf"
                onChange={async (e) => {
                    if (!e.target.files || !uploadConfig) return;
                    const formData = new FormData();
                    formData.append('file', e.target.files[0]);
                    try {
                        const res = await fetch(`${API_BASE}/upload/${uploadConfig.id}/${uploadConfig.type}`, { method: 'POST', body: formData });
                        if (res.ok) fetchTasks();
                        else alert("Upload failed");
                    } catch (error) { console.error("Upload error:", error); }
                    finally { e.target.value = ''; setUploadConfig(null); }
                }}
            />

            <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-sky-500/15 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
                            <Package size={20} className="text-sky-400" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Logistics Control</h1>
                            <p className="text-white/30 text-xs font-medium tracking-[0.15em] uppercase mt-0.5">Fleet & Document Management</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 text-white px-5 py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 shadow-lg shadow-sky-500/20 active:scale-95"
                    >
                        <Plus size={16} />
                        New Dispatch
                    </button>
                </div>

                {/* ── Stats row ── */}
                {!loading && tasks.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        {(["WAITING","IN TRANSIT","COMPLETED","CANCELLED"] as const).map(s => {
                            const count = tasks.filter(t => t.status.toUpperCase() === s).length;
                            const sc = statusConfig[s];
                            return (
                                <div key={s} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3 flex items-center gap-3">
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`} />
                                    <div>
                                        <p className={`text-lg font-black ${sc.text}`}>{count}</p>
                                        <p className="text-white/30 text-[9px] uppercase tracking-widest font-bold">{sc.label}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Content ── */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl overflow-hidden">

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center">
                                <Loader2 className="animate-spin text-sky-400" size={24} />
                            </div>
                            <p className="text-white/20 text-sm font-medium shimmer">Loading dispatches…</p>
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
                                <Package size={24} className="text-white/20" />
                            </div>
                            <p className="text-white/30 text-sm font-medium">No dispatches yet</p>
                            <button onClick={() => setIsModalOpen(true)} className="text-sky-400 text-xs font-bold hover:underline">Create your first dispatch →</button>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden lg:block overflow-x-auto scrollbar-hide">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/[0.06]">
                                            {["Docs","Origin","Customer","Machine","PIC","Schedule","Status",""].map((h, i) => (
                                                <th key={i} className={`px-6 py-4 text-[9px] font-black text-white/25 uppercase tracking-[0.2em] ${i === 0 || i === 6 ? 'text-center' : 'text-left'} ${i === 7 ? 'text-right' : ''}`}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tasks.map((task, idx) => {
                                            const sc = getStatusConfig(task.status);
                                            return (
                                                <tr key={task.id} className="group border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors" style={{ animationDelay: `${idx * 40}ms` }}>
                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-center gap-4">
                                                            <DocumentItem task={task} type="installation" hasFile={task.hasInstallationForm} onView={() => handleViewPdf(task.id,'installation')} onUpload={() => triggerUpload(task.id,'installation')} label="Install" />
                                                            <DocumentItem task={task} type="do" hasFile={task.hasDo} onView={() => handleViewPdf(task.id,'do')} onUpload={() => triggerUpload(task.id,'do')} label="D.Order" />
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-white/40 text-xs font-semibold mono">{task.from}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-white text-sm font-semibold">{task.companyName}</p>
                                                        <p className="text-white/30 text-[11px] font-medium mt-0.5">{task.location}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sky-400 text-sm font-semibold">{task.item}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-white/60 text-sm font-medium">{task.picDeliver}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-white/50 text-xs font-medium mono">
                                                            {new Date(task.time).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit', hour12:true })}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center relative">
                                                        <button
                                                            onClick={() => setOpenStatusId(openStatusId === task.id ? null : task.id)}
                                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all ${sc.bg} ${sc.text} ${sc.border} hover:brightness-110`}
                                                        >
                                                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                                            {sc.label}
                                                            <ChevronDown size={10} />
                                                        </button>
                                                        {openStatusId === task.id && (
                                                            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-36 bg-[#161b27] border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden fade-up">
                                                                {["Waiting","In Transit","Completed","Cancelled"].map(s => (
                                                                    <button key={s} onClick={() => handleStatusUpdate(task.id, s)} className="w-full px-4 py-2.5 text-[11px] font-semibold text-white/50 hover:bg-white/5 hover:text-white text-left transition-colors">{s}</button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => handleEditClick(task)} className="p-2 rounded-xl text-white/30 hover:text-sky-400 hover:bg-sky-400/10 transition-all">
                                                                <Edit3 size={15} />
                                                            </button>
                                                            <button onClick={() => handleDelete(task.id)} className="p-2 rounded-xl text-white/30 hover:text-rose-400 hover:bg-rose-400/10 transition-all">
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="lg:hidden p-4 space-y-3">
                                {tasks.map(task => <MobileCard key={task.id} task={task} />)}
                            </div>
                        </>
                    )}
                </div>

                {!loading && tasks.length > 0 && (
                    <p className="text-white/15 text-xs text-center mt-4 font-medium">{tasks.length} dispatch{tasks.length !== 1 ? 'es' : ''} total</p>
                )}
            </div>

            {/* ── EDIT MODAL ── */}
            {isEditModalOpen && editingTask && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
                    <div className="bg-[#131820] border border-white/[0.08] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl shadow-2xl fade-up overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                            <div>
                                <h3 className="text-lg font-black text-white">Edit Dispatch</h3>
                                <p className="text-white/25 text-xs mt-0.5 mono">ID #{editingTask.id}</p>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 transition-all">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto scrollbar-hide">
                            {[
                                { label: "From", key: "from", col: 2 },
                                { label: "Customer Name", key: "companyName", col: 2 },
                                { label: "Location", key: "location", col: 2 },
                                { label: "Deliver PIC", key: "picDeliver", col: 2 },
                                { label: "Machine Model", key: "item", col: 1 },
                            ].map(({ label, key, col }) => (
                                <div key={key} className={col === 2 ? "sm:col-span-2" : ""}>
                                    <label className={labelCls}>{label}</label>
                                    <input type="text" className={inputCls} value={editingTask[key] ?? ''} onChange={e => setEditingTask({ ...editingTask, [key]: e.target.value })} />
                                </div>
                            ))}
                            <div>
                                <label className={labelCls}>Schedule Time</label>
                                <input type="datetime-local" className={inputCls} value={editingTask.scheduledTime ?? ''} onChange={e => setEditingTask({ ...editingTask, scheduledTime: e.target.value })} />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3">
                            <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 rounded-xl text-sm font-bold text-white/30 bg-white/5 hover:bg-white/8 transition-all">Discard</button>
                            <button onClick={handleUpdateTask} className="flex-1 py-3 rounded-xl text-sm font-black text-white bg-sky-500 hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20 active:scale-95">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── CREATE MODAL ── */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
                    <div className="bg-[#131820] border border-white/[0.08] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-4xl shadow-2xl overflow-hidden fade-up">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                            <div>
                                <h3 className="text-lg font-black text-white">New Dispatch</h3>
                                <p className="text-white/25 text-xs mt-0.5">Schedule new machine deliveries</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 transition-all">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-hide space-y-4">
                            {newTasks.map((task, index) => (
                                <div key={index} className="relative bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
                                    {newTasks.length > 1 && (
                                        <button onClick={() => handleRemoveRow(index)} className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 flex items-center justify-center transition-all">
                                            <X size={14} />
                                        </button>
                                    )}
                                    {newTasks.length > 1 && (
                                        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.15em] mb-4">Entry {index + 1}</p>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {[
                                            { label: "From", key: "from", placeholder: "Warehouse / Store" },
                                            { label: "Customer", key: "companyName", placeholder: "Company Name" },
                                            { label: "City", key: "location", placeholder: "Delivery Location" },
                                            { label: "Machine Model", key: "item", placeholder: "Item Name" },
                                            { label: "In-Charge Person", key: "picDeliver", placeholder: "PIC Name" },
                                        ].map(({ label, key, placeholder }) => (
                                            <div key={key}>
                                                <label className={labelCls}>{label}</label>
                                                <input type="text" placeholder={placeholder} className={inputCls}
                                                    value={(task as any)[key]} onChange={(e) => handleInputChange(index, key, e.target.value)} />
                                            </div>
                                        ))}
                                        <div>
                                            <label className={labelCls}>Schedule Date & Time</label>
                                            <input type="datetime-local" className={inputCls}
                                                value={task.scheduledTime} onChange={(e) => handleInputChange(index, 'scheduledTime', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button onClick={handleAddRow} className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-white/25 font-bold text-xs hover:border-sky-500/30 hover:text-sky-400/70 transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
                                <Plus size={16} /> Add Another Entry
                            </button>
                        </div>

                        <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl text-sm font-bold text-white/30 bg-white/5 hover:bg-white/8 transition-all">Cancel</button>
                            <button onClick={handleSubmitNewTasks} className="flex-1 py-3 rounded-xl text-sm font-black text-white bg-sky-500 hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20 active:scale-95">
                                Deploy Dispatch
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLogisticsTable;