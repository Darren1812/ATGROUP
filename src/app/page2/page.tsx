"use client";

import { useEffect, useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAuth } from '@/context/AuthContext';

import {
  Package, Plus, Trash2, RefreshCw, MapPin, Building2, User, Clock, Truck, CheckCircle2, Loader2, ArrowRight, X, Upload, FileText, Eye, Search, SlidersHorizontal, ChevronDown, Filter, Columns3, GripVertical,CircleDot,Settings, Phone
} from "lucide-react";

const API = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Logistics`;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  Waiting: {
    label: "Waiting",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    dot: "bg-amber-400",
  },
  Arrange: {
    label: "Arranging",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    dot: "bg-blue-500",
  },
  Delivering: {
    label: "Delivering",
    color: "text-indigo-700",
    bg: "bg-indigo-50 border-indigo-200",
    dot: "bg-indigo-500",
  },
  Done: {
    label: "Done",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
  },
};

/* =========================
   COLUMNS CONFIG
========================= */
const COLUMN_DEFS = [
  { key: "createdAt", label: "At", icon: Clock, width: 100 },
  { key: "createdBy", label: "BY", icon: User, width: 60},
  { key: "from", label: "From", icon: Building2, width: 160 },
  { key: "companyName", label: "Company Name", icon: Building2, width: 160 },
  { key: "location", label: "Location", icon: MapPin, width: 180 },
  { key: "phoneNumber", label: "Phone", icon: Phone, width: 100},
  { key: "item", label: "Item", icon: Package, width: 300 },
  { key: "estimate", label: "Estimate", icon: Clock, width: 200 },
  { key: "schedule", label: "Schedule", icon: Clock, width: 200 },
  { key: "pic", label: "PIC", icon: User, width: 120 },
  { key: "status", label: "Status", icon: CircleDot, width: 150 },
  { key: "documents", label: "Documents", icon: FileText, width: 140 },
  { key: "action", label: "Action", icon: Settings, width: 100 },
];

/* =========================
   DRAG HEADER
========================= */
function SortableHeader({ col }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: col.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = col.icon;

  return (
    <th
      ref={setNodeRef}
      style={{ ...style, width: `${col.width}px` }}
      className="px-5 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap bg-slate-50 border-b border-slate-200"
    >
      <div className="flex items-center gap-1.5">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-slate-200 rounded transition-colors"
          title="Drag to reorder"
        >
          <GripVertical size={14} className="text-slate-400" />
        </button>
        {Icon && <Icon size={11} />}
        {col.label}
      </div>
    </th>
  );
}

// ── Highlight matching text in search ──
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query || !text) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-amber-200 text-amber-900 rounded px-0.5 not-italic">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

// ── Small removable chip shown below filter bar ──
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-indigo-900 transition-colors">
        <X size={11} />
      </button>
    </span>
  );
}

export default function LogisticsPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [docStatus, setDocStatus] = useState<Record<number, { install: boolean; do: boolean }>>({});
  const [uploadingDoc, setUploadingDoc] = useState<Record<string, boolean>>({});

  // ── Search & Filter ──
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPic, setFilterPic] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // ── Column Management ──
  const [columns, setColumns] = useState(
    COLUMN_DEFS.map((c) => ({ ...c, visible: true }))
  );
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  // ── Drag sensors ──
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setColumns((cols) => {
      const oldIndex = cols.findIndex((c) => c.key === active.id);
      const newIndex = cols.findIndex((c) => c.key === over.id);
      return arrayMove(cols, oldIndex, newIndex);
    });
  };

  const toggleColumn = (key: string) => {
    setColumns((cols) =>
      cols.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c))
    );
  };

  const resetColumns = () => {
    setColumns(COLUMN_DEFS.map((c) => ({ ...c, visible: true })));
  };

  const visibleColumns = useMemo(() => columns.filter((c) => c.visible), [columns]);

  const triggerUpload = (id: number, type: "installation" | "do") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const key = `${id}-${type}`;
      setUploadingDoc((prev) => ({ ...prev, [key]: true }));
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${API}/upload/${id}/${type}`, { method: "POST", body: formData });
        if (res.ok) {
          setDocStatus((prev) => ({
            ...prev,
            [id]: { ...prev[id], [type === "installation" ? "install" : "do"]: true },
          }));
        } else {
          alert("Upload failed. Please try again.");
        }
      } catch (err) {
        console.error(err);
        alert("Upload error.");
      }
      setUploadingDoc((prev) => ({ ...prev, [key]: false }));
    };
    input.click();
  };

  const viewDocument = (id: number, type: "installation" | "do") => {
    window.open(`${API}/view/${id}/${type}`, "_blank");
  };

  const emptyRow = { createdAt: "", from: "", companyName: "", location: "", item: "", scheduledTime: "", picDeliver: "", phoneNumber: "", createdBy: "" };
  const [newTasks, setNewTasks] = useState<any[]>([emptyRow]);

  // ── FETCH ──
  const fetchTasks = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const res = await fetch(API);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error(err);
    }
    isRefresh ? setRefreshing(false) : setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // ── CREATE ──
  const createTask = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTasks),
      });
      if (res.ok) {
        setNewTasks([emptyRow]);
        setShowForm(false);
        fetchTasks(true);
      }
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  const addRow = () => setNewTasks([...newTasks, { ...emptyRow }]);
  const removeRow = (i: number) => setNewTasks(newTasks.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: string, value: string) => {
    const copy = [...newTasks];
    copy[i] = { ...copy[i], [field]: value };
    setNewTasks(copy);
  };

  // ── DELETE ──
  const deleteTask = async (id: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    setDeletingId(id);
    const r = await fetch(`${API}/${id}`, { method: "DELETE" });
    if (r.ok) fetchTasks(true);
    setDeletingId(null);
  };

  // ── PATCH ──
  const updateEstimate = async (id: number, value: string) => {
    // 1. 如果 value 是 "yyyy-mm-ddThh:mm"，将其转换为完整的 ISO 格式
    // 加上 'Z' 后缀，告诉服务器这是一个 UTC 时间
    const isoValue = new Date(value).toISOString();

    await fetch(`${API}/estimate/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      // 2. 确保作为 JSON 对象发送
      body: JSON.stringify(isoValue) 
    });
    fetchTasks(true);
  };
  const updateSchedule = async (id: number, value: string) => {
    await fetch(`${API}/schedule/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
    fetchTasks(true);
  };
  // ── 修改后的 updatePic ──
  const updatePic = async (id: number, value: string) => {
    // 1. 先更新 PIC
    await fetch(`${API}/pic/${id}`, { 
      method: "PATCH", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify(value) 
    });

    // 2. 逻辑判断：如果有了 PIC，状态就设为 "Arrange"，否则设为 "Waiting"
    const newStatus = value ? "Arrange" : "Waiting";

    // 3. 调用您刚才定义的 UpdateStatus 接口
    await fetch(`${API}/status/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStatus) // 发送新的状态值
    });

    // 4. 最后重新获取数据刷新列表
    fetchTasks(true);
  };
  // ── Unique PIC list for dropdown ──
  const picOptions = useMemo(() => {
    const s = new Set(tasks.map((t) => t.picDeliver).filter(Boolean));
    return Array.from(s).sort() as string[];
  }, [tasks]);

  // ── Filtered tasks ──
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const haystack = [t.createdAt, t.item, t.location, t.companyName, t.picDeliver]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filterPic && t.picDeliver !== filterPic) return false;
      const computedStatus =
        t.status === "Delivering" || t.status === "Done"
          ? t.status
          : t.scheduledAt && t.picDeliver
          ? "Arrange"
          : "Waiting";

      if (filterStatus && computedStatus !== filterStatus) return false;
      if (filterDateFrom || filterDateTo) {
        const scheduled = t.scheduledAt ? new Date(t.scheduledAt) : null;
        if (!scheduled) return false;
        if (filterDateFrom && scheduled < new Date(filterDateFrom)) return false;
        if (filterDateTo) {
          const to = new Date(filterDateTo);
          to.setHours(23, 59, 59, 999);
          if (scheduled > to) return false;
        }
      }
      return true;
    });
  }, [tasks, searchQuery, filterPic, filterStatus, filterDateFrom, filterDateTo]);

  const activeFilterCount = [filterPic, filterStatus, filterDateFrom, filterDateTo].filter(Boolean).length;
  const clearAllFilters = () => {
    setSearchQuery("");
    setFilterPic("");
    setFilterStatus("");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const renderCellContent = (t: any, colKey: string) => {
    const computedStatus = t.scheduledAt && t.picDeliver ? "Arrange" : "Waiting";
    const cfg = STATUS_CONFIG[computedStatus] ?? STATUS_CONFIG["Waiting"];
    const isInstallUploaded = docStatus[t.id]?.install || t.hasInstallationForm;
    const isDoUploaded = docStatus[t.id]?.do || t.hasDo;
    const mapUrl = (value : string ) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`;
    interface LinkWrapperProps {
      children: React.ReactNode;
      className?: string; // className 通常是可选的，所以加上 ?
      href?: string;      // 如果你要传 href，建议也加上
    }

    // 2. 使用 React.FC 定义组件，TypeScript 会自动推断类型
    const LinkWrapper: React.FC<LinkWrapperProps> = ({ children, className, href = "#" }) => (
      <a 
        href={href}
        target="_blank" 
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 border ${className || ''}`}
      >
        {children}
      </a>
    );    
    switch (colKey) {
      case "createdAt":
        return (
          <span className="text-[11px] w-[160px] text-gray-400 leading-snug">
            <Highlight text={t.createdAt} query={searchQuery} />
          </span>
        );
      case "createdBy":
        return (
          <span className="text-gray-400 text-xs leading-snug text-[11px] px-2 py-1.5 w-[50px]">
            <Highlight text={t.createdBy} query={searchQuery} />
          </span>
        );
      case "from":
        return(
          <LinkWrapper
                href={mapUrl(t.from)}
                className="bg-emerald-50 text emerald-700 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200">
                  <MapPin size={12} />
                  <Highlight text={t.from} query={searchQuery} />
          </LinkWrapper>         
        )
      // In your switch case:
      case "companyName":
        return (
          <LinkWrapper 
                href={mapUrl(t.companyName)} 
                className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200"
              >
                <MapPin size={12} />
                <Highlight text={t.companyName} query={searchQuery} />
              </LinkWrapper>
            );
      case "location":
        return (
          <LinkWrapper 
                href={mapUrl(t.location)} 
                className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 text-[11px] px-2 py-1.5 w-[100px]" 
              >
                <MapPin size={12} />
                <Highlight text={t.location} query={searchQuery} />
              </LinkWrapper>
            );
      case "phoneNumber":
        return (
          <span className="text-[11px] px-2 py-1.5 w-[160px] text-gray-400 text-xs leading-snug">
            <Highlight text={t.phoneNumber} query={searchQuery} />
          </span>
        );

      case "item":
        return (
          <span className="inline-flex flex-col px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 leading-snug whitespace-pre-wrap text-[11px] px-2 py-1.5 w-[200px] ">
            {t.item?.split("\n").map((line: string, i: number) => (
              <span key={i}>
                <Highlight text={line} query={searchQuery} />
              </span>
            ))}
          </span>
        );
      case "estimate":
        return (
          <input
            type="datetime-local"
            defaultValue={formatDate(t.time)}
            onBlur={(e) => updateEstimate(t.id, e.target.value)}
            className="text-[11px] px-2 py-1.5 w-[160px] border border-slate-200 rounded-lg bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-700"
          />
        );
      case "schedule":
        return (
          <input
            type="datetime-local"
            defaultValue={formatDate(t.scheduledAt)}
            onBlur={(e) => updateSchedule(t.id, e.target.value)}
            className="text-xs px-3 py-2text-[11px] px-2 py-1.5 w-[160px] border border-slate-200 rounded-lg bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-700 "
          />
        );
      case "pic":
        return (
          <input
            defaultValue={t.picDeliver}
            onBlur={(e) => updatePic(t.id, e.target.value)}
            className="text-[11px] px-2 py-1.5 w-[90px] border border-slate-200 rounded-lg bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-700 "
          />
        );
      case "status":
        // 直接使用从 API 获取的 t.status
        const cfg = STATUS_CONFIG[t.status] ?? STATUS_CONFIG["Waiting"];
        return (
          <div className={`text-[11px] px-2 py-1.5 w-[90px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${cfg.bg} ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
            {cfg.label}
          </div>
        );
        case "documents":
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => triggerUpload(t.id, "installation")}
                disabled={uploadingDoc[`${t.id}-installation`]}
                title="Upload Installation Form"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all disabled:opacity-50
                  ${isInstallUploaded ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"}`}
              >
                {uploadingDoc[`${t.id}-installation`] ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : isInstallUploaded ? (
                  <CheckCircle2 size={11} />
                ) : (
                  <Upload size={11} />
                )}
                Install
              </button>
              <button
                onClick={() => viewDocument(t.id, "installation")}
                title="View"
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
              >
                <Eye size={13} />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => triggerUpload(t.id, "do")}
                disabled={uploadingDoc[`${t.id}-do`]}
                title="Upload Delivery Order"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all disabled:opacity-50
                  ${isDoUploaded ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"}`}
              >
                {uploadingDoc[`${t.id}-do`] ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : isDoUploaded ? (
                  <CheckCircle2 size={11} />
                ) : (
                  <Upload size={11} />
                )}
                DO
              </button>
              <button
                onClick={() => viewDocument(t.id, "do")}
                title="View"
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
              >
                <Eye size={13} />
              </button>
            </div>
          </div>
        );
      case "action":
        return (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => (window.location.href = `/logistics/${t.id}`)}
              className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg transition-colors whitespace-nowrap"
            >
              Edit <ArrowRight size={11} />
            </button>
            <button
              onClick={() => deleteTask(t.id)}
              disabled={deletingId === t.id}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              {deletingId === t.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
            </button>
          </div>
        );
      default:
        return null;
    }
  };
const { user } = useAuth();
const [name, setName] = useState(user?.nameUse || '');
  return (
    <div className="min-h-screen bg-slate-50">
      {/* PAGE HEADER */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="w-full px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Truck className="text-white" size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Logistics Management</h1>
                <p className="text-slate-500 text-sm mt-0.5">Track and manage all delivery tasks</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchTasks(true)}
                disabled={refreshing}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              </button>
              <button
                onClick={() => setShowForm((v) => !v)}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-md shadow-indigo-200"
              >
                <Plus size={16} />
                New Task
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-8 py-8 space-y-6">
        {/* CREATE FORM */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Create New Tasks</h2>
                <p className="text-xs text-slate-400 mt-0.5">Fill in the details below. You can add multiple rows.</p>
              </div>
              <button
                onClick={() => {
                  setShowForm(false);
                  setNewTasks([emptyRow]);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div className="hidden md:grid grid-cols-8 gap-3 px-1">
                {["From", "Company", "Location", "Item", "Scheduled Time", "PIC", "Email", "Created By"].map((h) => (
                    <p key={h} className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    {h}
                  </p>
                ))}
              </div>
              {newTasks.map((task, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-8 gap-3 items-center group">
                  {(["from", "companyName", "location", "item"] as const).map((field) => (
                    <input
                      key={field}
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                      value={task[field]}
                      onChange={(e) => updateRow(i, field, e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800 placeholder:text-slate-400"
                    />
                  ))}
                  <input
                    type="datetime-local"
                    value={task.scheduledTime}
                    onChange={(e) => updateRow(i, "scheduledTime", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800"
                  />
                  <div className="flex gap-2">
                    <input
                      placeholder="PIC"
                      value={task.picDeliver}
                      onChange={(e) => updateRow(i, "picDeliver", e.target.value)}
                      className="flex-1 px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800 placeholder:text-slate-400"
                    />
                    {newTasks.length > 1 && (
                      <button
                        onClick={() => removeRow(i)}
                        className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                  <input
                    placeholder="Phone Number"
                    value={task.phoneNumber}
                    onChange={(e) => updateRow(i, "phoneNumber", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)} // You can actually remove this now!
                  readOnly // <--- Add this
                  className="border p-2 rounded bg-slate-100 cursor-not-allowed text-slate-500"
                  placeholder="Enter name"
                />
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={addRow}
                className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <Plus size={15} /> Add another row
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setNewTasks([emptyRow]);
                  }}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createTask}
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all duration-200 disabled:opacity-60 shadow-md shadow-indigo-200"
                >
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  {submitting ? "Saving..." : "Submit Tasks"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SEARCH + FILTER BAR */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Row 1: search input + column toggle + filter toggle + clear */}
          <div className="px-5 py-3.5 flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search item, location, company, PIC…"
                className="w-full pl-9 pr-9 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl border transition-all duration-200 whitespace-nowrap
                ${
                  showFilters || activeFilterCount > 0
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
            >
              <SlidersHorizontal size={15} />
              Filters
              {activeFilterCount > 0 && (
                <span
                  className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black
                  ${showFilters ? "bg-white text-indigo-600" : "bg-white text-indigo-600"}`}
                >
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown size={14} className={`transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`} />
            </button>

            {/* Clear all */}
            {(activeFilterCount > 0 || searchQuery) && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-bold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl border border-red-100 transition-all whitespace-nowrap"
              >
                <X size={14} /> Clear all
              </button>
            )}
          </div>

          {/* Row 2: filter dropdowns (collapsible) */}
          {showFilters && (
            <div className="px-5 pb-5 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* PIC */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User size={10} /> PIC
                </label>
                <div className="relative">
                  <select
                    value={filterPic}
                    onChange={(e) => setFilterPic(e.target.value)}
                    className={`w-full px-3 py-2.5 text-sm border rounded-xl appearance-none cursor-pointer pr-8 outline-none transition-all
                      ${
                        filterPic
                          ? "border-indigo-300 bg-indigo-50 text-indigo-700 font-semibold"
                          : "border-slate-200 bg-slate-50 text-slate-600 focus:bg-white focus:border-indigo-400"
                      }`}
                  >
                    <option value="">All PIC</option>
                    {picOptions.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter size={10} /> Status
                </label>
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className={`w-full px-3 py-2.5 text-sm border rounded-xl appearance-none cursor-pointer pr-8 outline-none transition-all
                      ${
                        filterStatus
                          ? "border-indigo-300 bg-indigo-50 text-indigo-700 font-semibold"
                          : "border-slate-200 bg-slate-50 text-slate-600 focus:bg-white focus:border-indigo-400"
                      }`}
                  >
                    <option value="">All Status</option>
                    <option value="Waiting">Waiting</option>
                    <option value="Arrange">Arranging</option>
                    <option value="Delivering">Delivering</option>
                    <option value="Done">Done</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Schedule From */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={10} /> Schedule From
                </label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm border rounded-xl outline-none transition-all
                    ${
                      filterDateFrom
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700 font-semibold"
                        : "border-slate-200 bg-slate-50 text-slate-600 focus:bg-white focus:border-indigo-400"
                    }`}
                />
              </div>

              {/* Schedule To */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={10} /> Schedule To
                </label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm border rounded-xl outline-none transition-all
                    ${
                      filterDateTo
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700 font-semibold"
                        : "border-slate-200 bg-slate-50 text-slate-600 focus:bg-white focus:border-indigo-400"
                    }`}
                />
              </div>
            </div>
          )}

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className={`px-5 pb-3.5 flex flex-wrap gap-2 ${showFilters ? "" : "border-t border-slate-100 pt-3"}`}>
              {filterPic && <FilterChip label={`PIC: ${filterPic}`} onRemove={() => setFilterPic("")} />}
              {filterStatus && <FilterChip label={`Status: ${filterStatus}`} onRemove={() => setFilterStatus("")} />}
              {filterDateFrom && <FilterChip label={`From: ${filterDateFrom}`} onRemove={() => setFilterDateFrom("")} />}
              {filterDateTo && <FilterChip label={`To: ${filterDateTo}`} onRemove={() => setFilterDateTo("")} />}
            </div>
          )}
        </div>
          {/* Column visibility toggle */}
          <div className="flex justify-between items-center">
            <div></div>

            <div className="relative">
              <button
                onClick={() => setShowColumnMenu((v) => !v)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl border transition-all duration-200 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              >
                <Columns3 size={15} />
                Columns
              </button>

              {/* Column menu dropdown */}
              {showColumnMenu && (
                <>
                  {/* Backdrop overlay */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowColumnMenu(false)}
                  />

                  {/* Dropdown menu */}
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-black text-slate-600 uppercase tracking-wider">
                        Show Columns
                      </span>
                      <button
                        onClick={resetColumns}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        Reset
                      </button>
                    </div>
                    <div className="p-2 max-h-80 overflow-y-auto">
                      {columns.map((col) => {
                        const Icon = col.icon;
                        return (
                          <button
                            key={col.key}
                            onClick={() => toggleColumn(col.key)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
                          >
                            <div
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                col.visible
                                  ? "bg-indigo-600 border-indigo-600"
                                  : "bg-white border-slate-300"
                              }`}
                            >
                              {col.visible && (
                                <CheckCircle2 size={12} className="text-white" />
                              )}
                            </div>
                            {Icon && <Icon size={14} className="text-slate-400" />}
                            <span className="text-sm font-medium text-slate-700">{col.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="px-4 py-2.5 border-t border-slate-100 text-xs text-slate-500">
                      {visibleColumns.length} of {columns.length} visible
                    </div>
                  </div>
                </>
              )}
            </div>
            </div>
        {/* TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-[11px] font-black tracking-[0.3em] text-slate-400 uppercase flex items-center gap-3">
              All Deliveries <div className="h-px w-16 bg-slate-200" />
            </h2>
            <span className="text-xs font-bold text-slate-400">
              {filteredTasks.length !== tasks.length ? (
                <>
                  {filteredTasks.length} <span className="text-slate-300 font-normal">of</span> {tasks.length} records
                </>
              ) : (
                <>
                  {tasks.length} record{tasks.length !== 1 ? "s" : ""}
                </>
              )}
            </span>
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center gap-4">
              <Loader2 size={32} className="text-indigo-400 animate-spin" />
              <p className="text-slate-400 text-sm font-medium">Loading tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-24 text-center">
              <div className="inline-flex p-6 rounded-full bg-slate-100 mb-4">
                <Package size={36} className="text-slate-300" />
              </div>
              {tasks.length === 0 ? (
                <>
                  <p className="text-slate-600 font-bold">No logistics tasks yet</p>
                  <p className="text-slate-400 text-sm mt-1">Click "New Task" to get started</p>
                </>
              ) : (
                <>
                  <p className="text-slate-600 font-bold">No results match your filters</p>
                  <button
                    onClick={clearAllFilters}
                    className="mt-3 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Clear all filters
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <table className="w-full text-sm border-collapse" style={{ minWidth: "1400px" }}>
                  <colgroup>
                    {visibleColumns.map((col) => (
                      <col key={col.key} style={{ width: `${col.width}px` }} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      <SortableContext items={visibleColumns.map((c) => c.key)} strategy={horizontalListSortingStrategy}>
                        {visibleColumns.map((col) => (
                          <SortableHeader key={col.key} col={col} />
                        ))}
                      </SortableContext>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredTasks.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/70 transition-colors duration-150 group">
                        {visibleColumns.map((col) => (
                          <td key={col.key} className="px-5 py-4">
                            {renderCellContent(t, col.key)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DndContext>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateString: string) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toISOString().slice(0, 16);
}