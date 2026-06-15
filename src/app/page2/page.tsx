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
import { useAuth } from "@/context/AuthContext";

import {
  Package,
  Plus,
  Trash2,
  RefreshCw,
  MapPin,
  Building2,
  User,
  Clock,
  Truck,
  CheckCircle2,
  Loader2,
  ArrowRight,
  X,
  Upload,
  FileText,
  Eye,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Filter,
  Columns3,
  GripVertical,
  CircleDot,
  Settings,
  Phone,
  Archive,
  Building,
  Sparkles,
} from "lucide-react";

interface OcrItem {
  description: string;
}

interface PendingTaskDraft {
  from: string;
  companyName: string;
  location: string;
  phoneNumber: string;
  department: string;
  picDeliver: string;
  scheduledTime: string | null;
  items: OcrItem[];
}

const API = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Logistics`;
const API2 = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/OCRAI`;

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
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
  Complete: {
    label: "Complete",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    dot: "bg-red-500",
  },
};

const COLUMN_DEFS = [
  { key: "orderNumber", label: "ID", icon: null, width: 100 },
  { key: "createdAt", label: "At", icon: Clock, width: 100 },
  { key: "createdBy", label: "BY", icon: User, width: 60 },
  { key: "from", label: "From", icon: Building2, width: 160 },
  { key: "companyName", label: "Company Name", icon: Building2, width: 160 },
  { key: "location", label: "Location", icon: MapPin, width: 180 },
  { key: "phoneNumber", label: "Phone", icon: Phone, width: 100 },
  { key: "item", label: "Item", icon: Package, width: 300 },
  { key: "estimate", label: "Estimate", icon: Clock, width: 200 },
  { key: "schedule", label: "Schedule", icon: Clock, width: 200 },
  { key: "pic", label: "PIC", icon: User, width: 120 },
  { key: "status", label: "Status", icon: CircleDot, width: 150 },
  { key: "documents", label: "Documents", icon: FileText, width: 140 },
  { key: "action", label: "Action", icon: Settings, width: 100 },
];

function SortableHeader({ col }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: col.key });

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
      className='px-5 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap bg-slate-50 border-b border-slate-200'
    >
      <div className='flex items-center gap-1.5'>
        <button
          {...attributes}
          {...listeners}
          className='cursor-grab active:cursor-grabbing p-0.5 hover:bg-slate-200 rounded transition-colors'
          title='Drag to reorder'
        >
          <GripVertical size={14} className='text-slate-400' />
        </button>
        {Icon && <Icon size={11} />}
        {col.label}
      </div>
    </th>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query || !text) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className='bg-amber-200 text-amber-900 rounded px-0.5 not-italic'
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className='inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-full'>
      {label}
      <button
        onClick={onRemove}
        className='hover:text-indigo-900 transition-colors'
      >
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

  const [docStatus, setDocStatus] = useState<
    Record<number, { install: boolean; do: boolean; complete: boolean }>
  >({});
  const [uploadingDoc, setUploadingDoc] = useState<Record<string, boolean>>({});

  // ── Search & Filter ──
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPic, setFilterPic] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterCompanyName, setFilterCompanyName] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterorderNumber, setFilterorderNumber] = useState("");
  const [filterCreatedAt, setFilterCreatedAt] = useState("");

  // ── Column Management ──
  const [columns, setColumns] = useState(
    COLUMN_DEFS.map((c) => ({ ...c, visible: true })),
  );
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const { user } = useAuth();

  // ── OCR / Pending Tasks ──
  const [pendingTasks, setPendingTasks] = useState<PendingTaskDraft[]>([]);

  // ── Drag sensors ──
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
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
      cols.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c)),
    );
  };

  const resetColumns = () => {
    setColumns(COLUMN_DEFS.map((c) => ({ ...c, visible: true })));
  };

  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible),
    [columns],
  );

  const triggerUpload = (
    id: number,
    type: "installation" | "do" | "complete",
  ) => {
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

        const res = await fetch(`${API}/upload/${id}/${type}`, {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          setDocStatus((prev) => ({
            ...prev,
            [id]: {
              ...prev[id],
              [type === "installation"
                ? "install"
                : type === "do"
                  ? "do"
                  : "complete"]: true,
            },
          }));

          if (type === "complete") {
            await fetch(`${API}/status/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify("Complete"),
            });
          }
        } else {
          alert("Upload failed. Please try again.");
        }
      } catch (err) {
        console.error(err);
        alert("Upload error.");
      }

      setUploadingDoc((prev) => ({ ...prev, [key]: false }));
      fetchTasks(true);
    };

    input.click();
  };

  const viewDocument = (
    id: number,
    type: "installation" | "do" | "complete",
  ) => {
    window.open(`${API}/view/${id}/${type}`, "_blank");
  };

  const emptyRow = {
    orderNumber: "",
    createdAt: "",
    from: "",
    companyName: "",
    location: "",
    item: "",
    scheduledTime: "",
    picDeliver: "",
    phoneNumber: "",
    createdBy: "",
  };
  const [newTasks, setNewTasks] = useState<any[]>([emptyRow]);

  // ── FETCH ──
  const fetchTasks = async (isRefresh = false) => {
    if (!user) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const department = user.department;

      const res = await fetch(
        `${API}/by-department?department=${encodeURIComponent(department)}`,
      );
      const data = await res.json();

      await Promise.all(
        data.map(async (t: any) => {
          if (t.hasComplete && t.status !== "Complete") {
            await fetch(`${API}/status/${t.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify("Complete"),
            });
          }
        }),
      );

      const updated = data.map((t: any) => ({
        ...t,
        status: t.hasComplete
          ? "Complete"
          : t.picDeliver
            ? "Arrange"
            : "Waiting",
      }));

      setTasks(updated);
    } catch (err) {
      console.error(err);
    }
    isRefresh ? setRefreshing(false) : setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  // ── CREATE ──
  const createTask = async () => {
    setSubmitting(true);
    try {
      const tasksWithUser = newTasks.map((task) => ({
        ...task,
        createdBy: user?.nameUse || "Unknown",
        department: user?.department || "",
        scheduledTime: task.scheduledTime || null,
      }));

      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tasksWithUser),
      });

      if (res.ok) {
        setNewTasks([emptyRow]);
        setShowForm(false);
        fetchTasks(true);
      } else {
        console.error("Failed to save tasks");
      }
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  const addRow = () => setNewTasks([...newTasks, { ...emptyRow }]);
  const removeRow = (i: number) =>
    setNewTasks(newTasks.filter((_, idx) => idx !== i));
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
  const updateEstimate = async (id: any, value: string) => {
    const utcString = value + ":00.000Z";
    await fetch(`${API}/estimate/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledTime: utcString }),
    });
  };

  const updateSchedule = async (id: number, value: string) => {
    await fetch(`${API}/schedule/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
    fetchTasks(true);
  };

  const updatePic = async (id: number, value: string, scheduleAt?: string) => {
    await fetch(`${API}/pic/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    let newStatus = "Waiting";
    if (value && scheduleAt) {
      newStatus = "Arranging";
    } else if (value) {
      newStatus = "Arrange";
    }

    await fetch(`${API}/status/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStatus),
    });

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
        const haystack = [
          t.companyName,
          t.createdAt,
          t.item,
          t.location,
          t.companyName,
          t.picDeliver,
          t.from,
          t.createdAt,
          t.orderNumber,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filterPic && t.picDeliver !== filterPic) return false;
      const computedStatus =
        t.status === "Complete"
          ? t.status
          : t.scheduledAt && t.picDeliver
            ? "Arrange"
            : "Waiting";

      if (filterStatus && computedStatus !== filterStatus) return false;
      if (filterDateFrom || filterDateTo) {
        const scheduled = t.scheduledAt ? new Date(t.scheduledAt) : null;
        if (!scheduled) return false;
        if (filterDateFrom && scheduled < new Date(filterDateFrom))
          return false;
        if (filterDateTo) {
          const to = new Date(filterDateTo);
          to.setHours(23, 59, 59, 999);
          if (scheduled > to) return false;
        }
      }
      if (filterCompanyName) {
        const company = t.companyName?.toLowerCase() || "";
        if (!company.includes(filterCompanyName.toLowerCase())) return false;
      }
      if (filterFrom) {
        const from = t.from?.toLowerCase() || "";
        if (!from.includes(filterFrom.toLowerCase())) return false;
      }
      if (filterorderNumber) {
        const orderNumber = t.orderNumber?.toLowerCase() || "";
        if (!orderNumber.includes(filterorderNumber.toLowerCase()))
          return false;
      }
      if (filterCreatedAt) {
        const createdAt = t.createdAt?.toLowerCase() || "";
        if (!createdAt.includes(filterCreatedAt.toLowerCase())) return false;
      }

      return true;
    });
  }, [
    tasks,
    searchQuery,
    filterCompanyName,
    filterPic,
    filterStatus,
    filterDateFrom,
    filterDateTo,
    filterFrom,
    filterCreatedAt,
    filterorderNumber,
  ]);

  const activeFilterCount = [
    filterCompanyName,
    filterFrom,
    filterPic,
    filterStatus,
    filterDateFrom,
    filterDateTo,
    filterCreatedAt,
    filterorderNumber,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setFilterCreatedAt("");
    setFilterorderNumber("");
    setFilterFrom("");
    setFilterCompanyName("");
    setSearchQuery("");
    setFilterPic("");
    setFilterStatus("");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  // ── OCR Upload ──
  const handleOcrUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API2}/parse-document`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("OCR processing failed");

      const ocrData = await response.json();

      const newTaskDraft: PendingTaskDraft = {
        from: ocrData.from_shop || "",
        companyName: ocrData.to_company || "",
        location: ocrData.to_location || "",
        phoneNumber: ocrData.phone_number || "",
        department: user?.department || "Marketing",
        picDeliver: "",
        scheduledTime: null,
        items: (ocrData.items || []).map((i: any) => ({
          description: i.description || "",
        })),
      };

      setPendingTasks((prev) => [...prev, newTaskDraft]);
    } catch (error) {
      console.error("OCR Error:", error);
      alert("OCR parsing failed, please try again.");
    }
  };

  // ── Draft control functions ──
  const updateDraftField = <K extends keyof PendingTaskDraft>(
    taskIdx: number,
    field: K,
    value: PendingTaskDraft[K], // 🌟 这样会自动匹配 PendingTaskDraft 结构里每个字段自己的类型
  ) => {
    setPendingTasks((prev) =>
      prev.map((draft, idx) =>
        idx === taskIdx ? { ...draft, [field]: value } : draft,
      ),
    );
  };

  const updateDraftItem = (taskIdx: number, itemIdx: number, value: string) => {
    setPendingTasks((prev) =>
      prev.map((draft, idx) => {
        if (idx !== taskIdx) return draft;
        const updatedItems = draft.items.map((item, i) =>
          i === itemIdx ? { description: value } : item,
        );
        return { ...draft, items: updatedItems };
      }),
    );
  };

  const removeDraftItem = (taskIdx: number, itemIdx: number) => {
    setPendingTasks((prev) =>
      prev.map((draft, idx) => {
        if (idx !== taskIdx) return draft;
        return { ...draft, items: draft.items.filter((_, i) => i !== itemIdx) };
      }),
    );
  };

  const addDraftItem = (taskIdx: number) => {
    setPendingTasks((prev) =>
      prev.map((draft, idx) => {
        if (idx !== taskIdx) return draft;
        return { ...draft, items: [...draft.items, { description: "" }] };
      }),
    );
  };

  // ── Submit all pending OCR tasks ──
  const handleConfirmSubmitAll = async () => {
    try {
      const payload = pendingTasks.map((draft) => {
        let formattedTime = null;

        if (draft.scheduledTime) {
          // 1. 先把可能存在的 'Z' 尾巴去掉
          let cleanTime = draft.scheduledTime.replace("Z", "");

          // 2. 🌟 关键防御：如果发现时间被转换成了非你所选的少 8 小时的 UTC 格式
          //    我们通过 JavaScript 的 Date 对象，强行把它还原成“所见即所得”的本地真实输入文本
          if (draft.scheduledTime.includes("Z")) {
            const utcDate = new Date(draft.scheduledTime);
            // 重新拼装成绝对不带时区偏移的本地 "YYYY-MM-DDTHH:mm:ss" 字符串
            const year = utcDate.getFullYear();
            const month = String(utcDate.getMonth() + 1).padStart(2, "0");
            const day = String(utcDate.getDate()).padStart(2, "0");
            const hours = String(utcDate.getHours()).padStart(2, "0");
            const minutes = String(utcDate.getMinutes()).padStart(2, "0");
            const seconds = String(utcDate.getSeconds()).padStart(2, "0");

            formattedTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
          } else {
            // 如果本来就是纯本地字符串，确保格式为 YYYY-MM-DDTHH:mm:ss
            formattedTime = cleanTime.includes("T")
              ? cleanTime.split(":").length === 2
                ? `${cleanTime}:00`
                : cleanTime
              : `${cleanTime}:00`;
          }
        }

        return {
          department: user?.department || "Software Engineer", //
          createdBy: user?.nameUse || "Darren", //
          from: draft.from,
          companyName: draft.companyName,
          location: draft.location,
          phoneNumber: draft.phoneNumber,
          picDeliver: draft.picDeliver || "",
          status: "Waiting",

          // 🌟 这次发送出去的绝对是纯净的 "2026-06-19T16:17:00"，没任何人能背地里篡改它
          scheduledTime: formattedTime,

          items: draft.items.map((i) => ({ description: i.description })),
        };
      });

      // 后续的 fetch 提交代码保持不变
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Logistics/create-from-ocr`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (res.ok) {
        setPendingTasks([]);
        fetchTasks(true);
        alert("Tasks created successfully!");
      } else {
        alert("Save failed.");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred during submission.");
    }
  };
  // ── Export ──
  const [isExporting, setIsExporting] = useState(false);

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (filterorderNumber) params.set("orderNumber", filterorderNumber);
      if (filterCreatedAt) params.set("createdAt", filterCreatedAt);
      if (filterFrom) params.set("from", filterFrom);
      if (filterCompanyName) params.set("companyName", filterCompanyName);
      if (filterPic) params.set("pic", filterPic);
      if (filterStatus) params.set("status", filterStatus);
      if (filterDateFrom) params.set("dateFrom", filterDateFrom);
      if (filterDateTo) params.set("dateTo", filterDateTo);

      const response = await fetch(
        `${API}/export-full-zip?${params.toString()}`,
        { method: "GET" },
      );

      if (!response.ok) throw new Error("Failed to generate zip");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const date = new Date().toISOString().split("T")[0];
      link.setAttribute("download", `Logistics_Backup_${date}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Export failed. Please check your connection.");
    } finally {
      setIsExporting(false);
    }
  };

  const [name, setName] = useState(user?.nameUse || "");

  const renderCellContent = (t: any, colKey: string) => {
    const isInstallUploaded = docStatus[t.id]?.install || t.hasInstallationForm;
    const isDoUploaded = docStatus[t.id]?.do || t.hasDo;
    const isCompleteUploaded = docStatus[t.id]?.complete || t.hasComplete;
    const mapUrl = (value: string) =>
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`;

    interface LinkWrapperProps {
      children: React.ReactNode;
      className?: string;
      href?: string;
    }

    const formatForInput = (utcDateString: string | number | Date) => {
      if (!utcDateString) return "";
      const date = new Date(utcDateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const LinkWrapper: React.FC<LinkWrapperProps> = ({
      children,
      className,
      href = "#",
    }) => (
      <a
        href={href}
        target='_blank'
        rel='noopener noreferrer'
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-200 border ${className || ""}`}
      >
        {children}
      </a>
    );

    const getTodayMinString = () => {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      return now.toISOString().slice(0, 16);
    };

    switch (colKey) {
      case "orderNumber":
        return (
          <span className='text-[11px] w-[100px] text-gray-400 leading-snug'>
            <Highlight text={t.orderNumber} query={searchQuery} />
          </span>
        );
      case "createdAt":
        return (
          <span className='text-[11px] w-[160px] text-gray-400 leading-snug'>
            <Highlight text={t.createdAt} query={searchQuery} />
          </span>
        );
      case "createdBy":
        return (
          <span className='text-gray-400 text-xs leading-snug text-[11px] px-2 py-1.5 w-[50px]'>
            <Highlight text={t.createdBy} query={searchQuery} />
          </span>
        );
      case "from":
        return (
          <LinkWrapper
            href={mapUrl(t.from)}
            className='bg-emerald-50 text emerald-700 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200'
          >
            <Highlight text={t.from} query={searchQuery} />
          </LinkWrapper>
        );
      case "companyName":
        return (
          <LinkWrapper
            href={mapUrl(t.companyName)}
            className='bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200'
          >
            <Highlight text={t.companyName} query={searchQuery} />
          </LinkWrapper>
        );
      case "location":
        return (
          <LinkWrapper
            href={mapUrl(t.location)}
            className='bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 text-[11px] px-2 py-1.5 w-[100px]'
          >
            <Highlight text={t.location} query={searchQuery} />
          </LinkWrapper>
        );
      case "phoneNumber":
        return (
          <span className='text-[11px] px-2 py-1.5 w-[160px] text-gray-400 text-xs leading-snug'>
            <Highlight text={t.phoneNumber} query={searchQuery} />
          </span>
        );
      case "item":
        return (
          <span className='inline-flex flex-col px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 leading-snug whitespace-pre-wrap text-[11px] px-2 py-1.5 w-[200px]'>
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
            type='datetime-local'
            min={getTodayMinString()}
            defaultValue={formatForInput(t.time)}
            onBlur={(e) => updateEstimate(t.id, e.target.value)}
            className='text-[11px] px-2 py-1.5 w-[160px] border border-slate-200 rounded-lg bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-700'
          />
        );
      case "schedule":
        return (
          <input
            type='datetime-local'
            min={getTodayMinString()}
            defaultValue={formatDate(t.scheduledAt)}
            onBlur={(e) => updateSchedule(t.id, e.target.value)}
            className='text-[11px] px-2 py-1.5 w-[165px] border border-slate-200 rounded-lg bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-700'
          />
        );
      case "pic":
        const picListOptions = ["Akmal", "Nahfiz", "Darwin", "Darren"];
        return (
          <div className='relative w-[120px]'>
            <input
              list={`pic-list-${t.id}`}
              defaultValue={t.picDeliver}
              onBlur={(e) => updatePic(t.id, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              className='text-[11px] px-2 py-1.5 w-full border border-slate-200 rounded-lg bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-700'
              placeholder='Select PIC'
            />
            <datalist id={`pic-list-${t.id}`}>
              {picListOptions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
        );
      case "status":
        const cfg = STATUS_CONFIG[t.status] ?? STATUS_CONFIG["Waiting"];
        return (
          <div
            className={`text-[11px] px-2 py-1.5 w-[90px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${cfg.bg} ${cfg.color}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`}
            />
            {cfg.label}
          </div>
        );
      case "documents":
        return (
          <div className='flex flex-col gap-2'>
            <div className='flex items-center gap-1.5'>
              <button
                onClick={() => triggerUpload(t.id, "installation")}
                disabled={uploadingDoc[`${t.id}-installation`]}
                title='Upload Installation Form'
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all disabled:opacity-50
                  ${isInstallUploaded ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"}`}
              >
                {uploadingDoc[`${t.id}-installation`] ? (
                  <Loader2 size={11} className='animate-spin' />
                ) : isInstallUploaded ? (
                  <CheckCircle2 size={11} />
                ) : (
                  <Upload size={11} />
                )}
                Install
              </button>
              <button
                onClick={() => viewDocument(t.id, "installation")}
                title='View'
                className='p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all'
              >
                <Eye size={13} />
              </button>
            </div>
            <div className='flex items-center gap-1.5'>
              <button
                onClick={() => triggerUpload(t.id, "do")}
                disabled={uploadingDoc[`${t.id}-do`]}
                title='Upload Delivery Order'
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all disabled:opacity-50
                  ${isDoUploaded ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"}`}
              >
                {uploadingDoc[`${t.id}-do`] ? (
                  <Loader2 size={11} className='animate-spin' />
                ) : isDoUploaded ? (
                  <CheckCircle2 size={11} />
                ) : (
                  <Upload size={11} />
                )}
                DO
              </button>
              <button
                onClick={() => viewDocument(t.id, "do")}
                title='View'
                className='p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all'
              >
                <Eye size={13} />
              </button>
            </div>
            <div className='flex items-center gap-1.5'>
              <button
                onClick={() => triggerUpload(t.id, "complete")}
                disabled={uploadingDoc[`${t.id}-complete`]}
                title='Upload Completion Photo/Doc'
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all disabled:opacity-50
                  ${isCompleteUploaded ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100" : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"}`}
              >
                {uploadingDoc[`${t.id}-complete`] ? (
                  <Loader2 size={11} className='animate-spin' />
                ) : isCompleteUploaded ? (
                  <CheckCircle2 size={11} />
                ) : (
                  <Upload size={11} />
                )}
                Complete
              </button>
              <button
                onClick={() => viewDocument(t.id, "complete")}
                title='View Completion Proof'
                className='p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all'
              >
                <Eye size={13} />
              </button>
            </div>
          </div>
        );
      case "action":
        return (
          <div className='flex items-center gap-2 opacity-100 transition-opacity duration-200'>
            <button
              onClick={() => (window.location.href = `/logistics/${t.id}`)}
              className='flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg transition-colors whitespace-nowrap'
            >
              Edit <ArrowRight size={11} />
            </button>
            <button
              onClick={() => deleteTask(t.id)}
              disabled={deletingId === t.id}
              className='p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50'
            >
              {deletingId === t.id ? (
                <Loader2 size={15} className='animate-spin' />
              ) : (
                <Trash2 size={15} />
              )}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className='min-h-screen bg-slate-50'>
      {/* PAGE HEADER */}
      <div className='bg-white border-b border-slate-200 shadow-sm'>
        <div className='w-full px-8 py-6'>
          <div className='flex items-center justify-between gap-4'>
            <div className='flex items-center gap-4'>
              <div className='w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200'>
                <Truck className='text-white' size={22} />
              </div>
              <div>
                <h1 className='text-2xl font-black text-slate-900 tracking-tight'>
                  Logistics Management
                </h1>
                <p className='text-slate-500 text-sm mt-0.5'>
                  Track and manage all delivery tasks
                </p>
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <button
                onClick={() => fetchTasks(true)}
                disabled={refreshing}
                className='p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all duration-200 disabled:opacity-50'
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
              </button>

              {/* Hidden file input for OCR upload */}
              <input
                type='file'
                id='ocr-upload-input'
                accept='application/pdf,image/*'
                className='hidden'
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleOcrUpload(file);
                  // Reset input so same file can be re-uploaded
                  e.target.value = "";
                }}
              />
              <button
                onClick={() =>
                  document.getElementById("ocr-upload-input")?.click()
                }
                className='flex items-center gap-2 px-4 py-2 bg-violet-600 text-white font-bold rounded-lg hover:bg-violet-700 transition-colors shadow-sm text-xs'
              >
                <Sparkles size={14} className='animate-pulse' />
                AI Parse Document
              </button>

              <button
                onClick={() => setShowForm((v) => !v)}
                className='flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-md shadow-indigo-200'
              >
                <Plus size={16} />
                New Task
              </button>

              <button
                onClick={handleExportBackup}
                disabled={isExporting}
                className={`flex items-center gap-2 px-4 py-2.5 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-md 
                ${isExporting ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"}`}
              >
                <Archive
                  size={16}
                  className={isExporting ? "animate-spin" : ""}
                />
                {isExporting ? "Packaging..." : "Generate Record"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className='w-full px-8 py-8 space-y-6'>
        {/* ── AI DRAFT PREVIEW AREA ── */}
        {pendingTasks.length > 0 && (
          <div className='mb-6 p-4 border border-violet-200 bg-violet-50/40 rounded-xl'>
            {/* 顶部标题栏保持不变 */}
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-2'>
                <div className='p-1.5 bg-violet-100 text-violet-700 rounded-md'>
                  <FileText size={16} />
                </div>
                <div>
                  <h3 className='font-bold text-sm text-slate-800'>
                    AI Parsed Drafts — Pending Confirmation
                  </h3>
                  <p className='text-[11px] text-slate-500'>
                    Review details below, then save to the system. Multiple
                    items will be auto-split into separate tasks sharing the
                    same order number.
                  </p>
                </div>
              </div>
              <div className='flex gap-2'>
                <button
                  onClick={() => setPendingTasks([])}
                  className='px-3 py-1.5 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors'
                >
                  Clear Drafts
                </button>
                <button
                  onClick={handleConfirmSubmitAll}
                  className='flex items-center gap-1.5 px-4 py-1.5 text-xs font-black text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-all shadow-sm'
                >
                  Confirm & Save to System <ArrowRight size={13} />
                </button>
              </div>
            </div>

            {/* Draft cards */}
            <div className='grid grid-cols-1 gap-4'>
              {pendingTasks.map((draft, taskIndex) => (
                <div
                  key={taskIndex}
                  className='bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative'
                >
                  <button
                    onClick={() =>
                      setPendingTasks((prev) =>
                        prev.filter((_, idx) => idx !== taskIndex),
                      )
                    }
                    className='absolute top-3 right-3 text-slate-400 hover:text-slate-600'
                  >
                    <X size={14} />
                  </button>

                  {/* 发货、收货、电话 */}
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-3'>
                    <div>
                      <label className='block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1'>
                        From (Sender)
                      </label>
                      <input
                        type='text'
                        value={draft.from}
                        onChange={(e) =>
                          updateDraftField(taskIndex, "from", e.target.value)
                        }
                        className='w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[11px] font-medium focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none'
                      />
                    </div>
                    <div>
                      <label className='block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1'>
                        Company (Recipient)
                      </label>
                      <input
                        type='text'
                        value={draft.companyName}
                        onChange={(e) =>
                          updateDraftField(
                            taskIndex,
                            "companyName",
                            e.target.value,
                          )
                        }
                        className='w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[11px] font-medium focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none'
                      />
                    </div>
                    <div>
                      <label className='block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1'>
                        Phone
                      </label>
                      <input
                        type='text'
                        value={draft.phoneNumber}
                        onChange={(e) =>
                          updateDraftField(
                            taskIndex,
                            "phoneNumber",
                            e.target.value,
                          )
                        }
                        className='w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[11px] font-medium focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none'
                      />
                    </div>
                  </div>

                  {/* 地址与统一预计交货时间 */}
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-3 items-end'>
                    <div className='md:col-span-2'>
                      <label className='block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1'>
                        Location (Delivery Address)
                      </label>
                      <textarea
                        rows={2}
                        value={draft.location}
                        onChange={(e) =>
                          updateDraftField(
                            taskIndex,
                            "location",
                            e.target.value,
                          )
                        }
                        className='w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[11px] font-medium leading-relaxed focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none resize-none'
                      />
                    </div>
                    <div>
                      <label className='block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 text-violet-600'>
                        Estimate Delivery Time (Shared)
                      </label>
                      <input
                        type='datetime-local'
                        // 🌟 确保值直接输出 YYYY-MM-DDTHH:mm 格式，不进行任何时区转换
                        value={
                          draft.scheduledTime
                            ? draft.scheduledTime.substring(0, 16)
                            : ""
                        }
                        onChange={(e) => {
                          const val = e.target.value; // 例如得到 "2026-06-15T15:00"
                          updateDraftField(
                            taskIndex,
                            "scheduledTime",
                            val ? `${val}:00` : null, // 补齐秒数，原封不动地以纯字符串存进去
                          );
                        }}
                        className='w-full px-2.5 py-1.5 border border-violet-200 bg-violet-50/20 rounded-lg text-[11px] font-semibold text-slate-700 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none'
                      />
                    </div>
                  </div>

                  {/* Item 行拆分部分保持不变 */}
                  <div className='border-t border-slate-100 pt-3'>
                    <span className='inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-violet-50 border border-violet-100 text-violet-700 text-[10px] font-black uppercase tracking-wider mb-2'>
                      <Package size={11} />
                      Items — this document will auto-split into{" "}
                      {draft.items.length} task
                      {draft.items.length !== 1 ? "s" : ""} sharing the same
                      order number
                    </span>
                    <div className='space-y-1.5'>
                      {draft.items.map((item, itemIdx) => (
                        <div
                          key={itemIdx}
                          className='flex items-center gap-2 pl-2'
                        >
                          <span className='text-[10px] font-bold text-slate-400 w-4'>
                            #{itemIdx + 1}
                          </span>
                          <input
                            type='text'
                            value={item.description}
                            onChange={(e) =>
                              updateDraftItem(
                                taskIndex,
                                itemIdx,
                                e.target.value,
                              )
                            }
                            className='flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-medium text-slate-700 focus:border-violet-400 focus:ring-1 focus:ring-violet-100 outline-none'
                          />
                          <button
                            onClick={() => removeDraftItem(taskIndex, itemIdx)}
                            className='p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors'
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addDraftItem(taskIndex)}
                        className='flex items-center gap-1 pl-2 text-[11px] text-violet-600 font-bold hover:text-violet-800 transition-colors'
                      >
                        <Plus size={12} /> Add item row
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CREATE FORM */}
        {showForm && (
          <div className='bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden'>
            <div className='px-6 py-4 border-b border-slate-100 flex items-center justify-between'>
              <div>
                <h2 className='text-sm font-black text-slate-800 uppercase tracking-wider'>
                  Create New Tasks
                </h2>
                <p className='text-xs text-slate-400 mt-0.5'>
                  Fill in the details below. You can add multiple rows.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowForm(false);
                  setNewTasks([emptyRow]);
                }}
                className='p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors'
              >
                <X size={16} />
              </button>
            </div>
            <div className='p-6 space-y-3'>
              <div className='hidden md:grid grid-cols-8 gap-3 px-1'>
                {[
                  "From",
                  "Company",
                  "Location",
                  "Item",
                  "Estimate Time",
                  "Phone Number",
                  "Created By",
                ].map((h) => (
                  <p
                    key={h}
                    className='text-[10px] font-black text-slate-400 uppercase tracking-wider'
                  >
                    {h}
                  </p>
                ))}
              </div>
              {newTasks.map((task, i) => (
                <div
                  key={i}
                  className='grid grid-cols-1 md:grid-cols-8 gap-3 items-center group'
                >
                  {(["from", "companyName", "location", "item"] as const).map(
                    (field) =>
                      field === "item" ? (
                        <textarea
                          key={field}
                          placeholder='Item'
                          value={task[field]}
                          onChange={(e) => updateRow(i, field, e.target.value)}
                          rows={2}
                          className='w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800 placeholder:text-slate-400 resize-none'
                        />
                      ) : (
                        <input
                          key={field}
                          placeholder={
                            field.charAt(0).toUpperCase() + field.slice(1)
                          }
                          value={task[field]}
                          onChange={(e) => updateRow(i, field, e.target.value)}
                          className='w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800 placeholder:text-slate-400'
                        />
                      ),
                  )}
                  <input
                    type='datetime-local'
                    value={task.scheduledTime}
                    onChange={(e) =>
                      updateRow(i, "scheduledTime", e.target.value)
                    }
                    className='w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800'
                  />
                  <input
                    placeholder='Phone Number'
                    value={task.phoneNumber}
                    onChange={(e) =>
                      updateRow(i, "phoneNumber", e.target.value)
                    }
                    className='w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none'
                  />
                  <input
                    type='text'
                    value={name}
                    readOnly
                    className='border p-2 rounded bg-slate-100 cursor-not-allowed text-slate-500'
                    placeholder='Enter name'
                  />
                </div>
              ))}
            </div>
            <div className='px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between'>
              <button
                onClick={addRow}
                className='flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors'
              >
                <Plus size={15} /> Add another row
              </button>
              <div className='flex items-center gap-3'>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setNewTasks([emptyRow]);
                  }}
                  className='px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors'
                >
                  Cancel
                </button>
                <button
                  onClick={createTask}
                  disabled={submitting}
                  className='flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all duration-200 disabled:opacity-60 shadow-md shadow-indigo-200'
                >
                  {submitting ? (
                    <Loader2 size={15} className='animate-spin' />
                  ) : (
                    <CheckCircle2 size={15} />
                  )}
                  {submitting ? "Saving..." : "Submit Tasks"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SEARCH + FILTER BAR */}
        <div className='bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden'>
          <div className='px-5 py-3.5 flex items-center gap-3'>
            <div className='relative flex-1 min-w-0'>
              <Search
                size={15}
                className='absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none'
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search item, location, company, PIC…'
                className='w-full pl-9 pr-9 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800 placeholder:text-slate-400'
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors'
                >
                  <X size={14} />
                </button>
              )}
            </div>
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
                <span className='flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black bg-white text-indigo-600'>
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`}
              />
            </button>

            {(activeFilterCount > 0 || searchQuery) && (
              <button
                onClick={clearAllFilters}
                className='flex items-center gap-1.5 px-3 py-2.5 text-sm font-bold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl border border-red-100 transition-all whitespace-nowrap'
              >
                <X size={14} /> Clear all
              </button>
            )}
          </div>

          {showFilters && (
            <div className='px-5 pb-5 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
              <div className='flex flex-col gap-1.5'>
                <label className='text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5'>
                  <Building size={10} /> Order Number
                </label>
                <div className='relative'>
                  <input
                    type='text'
                    value={filterorderNumber}
                    onChange={(e) => setFilterorderNumber(e.target.value)}
                    placeholder='Search Order Number...'
                    className={`w-full px-3 py-2.5 text-sm border rounded-xl outline-none transition-all
                      ${filterorderNumber ? "border-indigo-300 bg-indigo-50 text-indigo-700 font-semibold" : "border-slate-200 bg-slate-50 text-slate-600 focus:bg-white focus:border-indigo-400"}`}
                  />
                  {filterorderNumber && (
                    <button
                      onClick={() => setFilterorderNumber("")}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
              <div className='flex flex-col gap-1.5'>
                <label className='text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5'>
                  <Building size={10} /> Created At
                </label>
                <div className='relative'>
                  <input
                    type='text'
                    value={filterCreatedAt}
                    onChange={(e) => setFilterCreatedAt(e.target.value)}
                    placeholder='Search Created Date...'
                    className={`w-full px-3 py-2.5 text-sm border rounded-xl outline-none transition-all
                      ${filterCreatedAt ? "border-indigo-300 bg-indigo-50 text-indigo-700 font-semibold" : "border-slate-200 bg-slate-50 text-slate-600 focus:bg-white focus:border-indigo-400"}`}
                  />
                  {filterCreatedAt && (
                    <button
                      onClick={() => setFilterCreatedAt("")}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
              <div className='flex flex-col gap-1.5'>
                <label className='text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5'>
                  <Building size={10} /> From
                </label>
                <div className='relative'>
                  <input
                    type='text'
                    value={filterFrom}
                    onChange={(e) => setFilterFrom(e.target.value)}
                    placeholder='Search From...'
                    className={`w-full px-3 py-2.5 text-sm border rounded-xl outline-none transition-all
                      ${filterFrom ? "border-indigo-300 bg-indigo-50 text-indigo-700 font-semibold" : "border-slate-200 bg-slate-50 text-slate-600 focus:bg-white focus:border-indigo-400"}`}
                  />
                  {filterFrom && (
                    <button
                      onClick={() => setFilterFrom("")}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
              <div className='flex flex-col gap-1.5'>
                <label className='text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5'>
                  <Building size={10} /> Company Name
                </label>
                <div className='relative'>
                  <input
                    type='text'
                    value={filterCompanyName}
                    onChange={(e) => setFilterCompanyName(e.target.value)}
                    placeholder='Search company...'
                    className={`w-full px-3 py-2.5 text-sm border rounded-xl outline-none transition-all
                      ${filterCompanyName ? "border-indigo-300 bg-indigo-50 text-indigo-700 font-semibold" : "border-slate-200 bg-slate-50 text-slate-600 focus:bg-white focus:border-indigo-400"}`}
                  />
                  {filterCompanyName && (
                    <button
                      onClick={() => setFilterCompanyName("")}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
              <div className='flex flex-col gap-1.5'>
                <label className='text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5'>
                  <User size={10} /> PIC
                </label>
                <div className='relative'>
                  <select
                    value={filterPic}
                    onChange={(e) => setFilterPic(e.target.value)}
                    className={`w-full px-3 py-2.5 text-sm border rounded-xl appearance-none cursor-pointer pr-8 outline-none transition-all
                      ${filterPic ? "border-indigo-300 bg-indigo-50 text-indigo-700 font-semibold" : "border-slate-200 bg-slate-50 text-slate-600 focus:bg-white focus:border-indigo-400"}`}
                  >
                    <option value=''>All PIC</option>
                    {picOptions.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={13}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none'
                  />
                </div>
              </div>
              <div className='flex flex-col gap-1.5'>
                <label className='text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5'>
                  <Filter size={10} /> Status
                </label>
                <div className='relative'>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className={`w-full px-3 py-2.5 text-sm border rounded-xl appearance-none cursor-pointer pr-8 outline-none transition-all
                      ${filterStatus ? "border-indigo-300 bg-indigo-50 text-indigo-700 font-semibold" : "border-slate-200 bg-slate-50 text-slate-600 focus:bg-white focus:border-indigo-400"}`}
                  >
                    <option value=''>All Status</option>
                    <option value='Waiting'>Waiting</option>
                    <option value='Arrange'>Arranging</option>
                    <option value='Complete'>Complete</option>
                  </select>
                  <ChevronDown
                    size={13}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none'
                  />
                </div>
              </div>
              <div className='flex flex-col gap-1.5'>
                <label className='text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5'>
                  <Clock size={10} /> Schedule From
                </label>
                <input
                  type='date'
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm border rounded-xl outline-none transition-all
                    ${filterDateFrom ? "border-indigo-300 bg-indigo-50 text-indigo-700 font-semibold" : "border-slate-200 bg-slate-50 text-slate-600 focus:bg-white focus:border-indigo-400"}`}
                />
              </div>
              <div className='flex flex-col gap-1.5'>
                <label className='text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5'>
                  <Clock size={10} /> Schedule To
                </label>
                <input
                  type='date'
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm border rounded-xl outline-none transition-all
                    ${filterDateTo ? "border-indigo-300 bg-indigo-50 text-indigo-700 font-semibold" : "border-slate-200 bg-slate-50 text-slate-600 focus:bg-white focus:border-indigo-400"}`}
                />
              </div>
            </div>
          )}

          {activeFilterCount > 0 && (
            <div
              className={`px-5 pb-3.5 flex flex-wrap gap-2 ${showFilters ? "" : "border-t border-slate-100 pt-3"}`}
            >
              {filterPic && (
                <FilterChip
                  label={`PIC: ${filterPic}`}
                  onRemove={() => setFilterPic("")}
                />
              )}
              {filterStatus && (
                <FilterChip
                  label={`Status: ${filterStatus}`}
                  onRemove={() => setFilterStatus("")}
                />
              )}
              {filterDateFrom && (
                <FilterChip
                  label={`From: ${filterDateFrom}`}
                  onRemove={() => setFilterDateFrom("")}
                />
              )}
              {filterDateTo && (
                <FilterChip
                  label={`To: ${filterDateTo}`}
                  onRemove={() => setFilterDateTo("")}
                />
              )}
            </div>
          )}
        </div>

        {/* Column visibility toggle */}
        <div className='flex justify-between items-center'>
          <div></div>
          <div className='relative'>
            <button
              onClick={() => setShowColumnMenu((v) => !v)}
              className='flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl border transition-all duration-200 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            >
              <Columns3 size={15} />
              Columns
            </button>

            {showColumnMenu && (
              <>
                <div
                  className='fixed inset-0 z-40'
                  onClick={() => setShowColumnMenu(false)}
                />
                <div className='absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden'>
                  <div className='px-4 py-3 border-b border-slate-100 flex items-center justify-between'>
                    <span className='text-xs font-black text-slate-600 uppercase tracking-wider'>
                      Show Columns
                    </span>
                    <button
                      onClick={resetColumns}
                      className='text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors'
                    >
                      Reset
                    </button>
                  </div>
                  <div className='p-2 max-h-80 overflow-y-auto'>
                    {columns.map((col) => {
                      const Icon = col.icon;
                      return (
                        <button
                          key={col.key}
                          onClick={() => toggleColumn(col.key)}
                          className='w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left'
                        >
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                              col.visible
                                ? "bg-indigo-600 border-indigo-600"
                                : "bg-white border-slate-300"
                            }`}
                          >
                            {col.visible && (
                              <CheckCircle2 size={12} className='text-white' />
                            )}
                          </div>
                          {Icon && (
                            <Icon size={14} className='text-slate-400' />
                          )}
                          <span className='text-sm font-medium text-slate-700'>
                            {col.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className='px-4 py-2.5 border-t border-slate-100 text-xs text-slate-500'>
                    {visibleColumns.length} of {columns.length} visible
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* TABLE */}
        <div className='bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden'>
          <div className='px-6 py-4 border-b border-slate-100 flex items-center justify-between'>
            <h2 className='text-[11px] font-black tracking-[0.3em] text-slate-400 uppercase flex items-center gap-3'>
              All Deliveries <div className='h-px w-16 bg-slate-200' />
            </h2>
            <span className='text-xs font-bold text-slate-400'>
              {filteredTasks.length !== tasks.length ? (
                <>
                  {filteredTasks.length}{" "}
                  <span className='text-slate-300 font-normal'>of</span>{" "}
                  {tasks.length} records
                </>
              ) : (
                <>
                  {tasks.length} record{tasks.length !== 1 ? "s" : ""}
                </>
              )}
            </span>
          </div>

          {loading ? (
            <div className='py-24 flex flex-col items-center gap-4'>
              <Loader2 size={32} className='text-indigo-400 animate-spin' />
              <p className='text-slate-400 text-sm font-medium'>
                Loading tasks...
              </p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className='py-24 text-center'>
              <div className='inline-flex p-6 rounded-full bg-slate-100 mb-4'>
                <Package size={36} className='text-slate-300' />
              </div>
              {tasks.length === 0 ? (
                <>
                  <p className='text-slate-600 font-bold'>
                    No logistics tasks yet
                  </p>
                  <p className='text-slate-400 text-sm mt-1'>
                    Click "New Task" to get started
                  </p>
                </>
              ) : (
                <>
                  <p className='text-slate-600 font-bold'>
                    No results match your filters
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className='mt-3 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors'
                  >
                    Clear all filters
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <table
                  className='w-full text-sm border-collapse'
                  style={{ minWidth: "1400px" }}
                >
                  <colgroup>
                    {visibleColumns.map((col) => (
                      <col key={col.key} style={{ width: `${col.width}px` }} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      <SortableContext
                        items={visibleColumns.map((c) => c.key)}
                        strategy={horizontalListSortingStrategy}
                      >
                        {visibleColumns.map((col) => (
                          <SortableHeader key={col.key} col={col} />
                        ))}
                      </SortableContext>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-100'>
                    {filteredTasks.map((t) => (
                      <tr
                        key={t.id}
                        className='hover:bg-slate-50/70 transition-colors duration-150 group'
                      >
                        {visibleColumns.map((col) => (
                          <td key={col.key} className='px-5 py-4'>
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
