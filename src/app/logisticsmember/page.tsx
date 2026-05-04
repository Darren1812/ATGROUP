"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Loader2,
  Package,
  Calendar,
  User,
  MapPin,
  Building2,
  FileText,
  Search,
  Truck,
  ArrowRight,
  Clock,
  Phone,
  CheckCircle2,
  AlertCircle,
  Upload,
  ListTodo,
  CheckCheck,
  Hourglass,
} from "lucide-react";

const API = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Logistics`;

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    bg: string;
    dot: string;
    gradient: string;
    icon: any;
  }
> = {
  Waiting: {
    label: "Waiting",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    dot: "bg-amber-400",
    gradient: "from-amber-500/10 to-amber-600/5",
    icon: Hourglass,
  },
  Arrange: {
    label: "Arranging",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    dot: "bg-blue-500",
    gradient: "from-blue-500/10 to-blue-600/5",
    icon: ListTodo,
  },
  Delivering: {
    label: "Delivering",
    color: "text-indigo-700",
    bg: "bg-indigo-50 border-indigo-200",
    dot: "bg-indigo-500",
    gradient: "from-indigo-500/10 to-indigo-600/5",
    icon: Truck,
  },
  Complete: {
    label: "Complete",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
    gradient: "from-emerald-500/10 to-emerald-600/5",
    icon: CheckCheck,
  },
};

export default function LogisticsPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("Arrange"); // Default to "Arranging"

  // Function to view PDF
  const handleViewDocument = async (
    id: number,
    type: "installation" | "do" | "complete",
  ) => {
    try {
      const newWindow = window.open("", "_blank");

      const res = await fetch(`${API}/view/${id}/${type}`);
      if (!res.ok) throw new Error("Document not available");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      if (newWindow) {
        newWindow.location.href = url;
      } else {
        window.location.href = url;
      }
    } catch (err) {
      console.error(err);
      alert("Could not open document. It might not be uploaded yet.");
    }
  };

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(API);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setTasks(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchTasks();
  }, [user]);

  const filteredTasks = useMemo(() => {
    if (!user) return [];
    return tasks.filter((t) => {
      const matchesPIC =
        t.picDeliver === user.name || t.picDeliver === user.nameUse;
      const matchesSearch =
        t.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.item.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = t.status === selectedStatus;

      return matchesPIC && matchesSearch && matchesStatus;
    });
  }, [tasks, user, searchTerm, selectedStatus]);

  const statusCounts = useMemo(() => {
    const userTasks = tasks.filter(
      (t) => t.picDeliver === user?.name || t.picDeliver === user?.nameUse,
    );

    return {
      Arrange: userTasks.filter((t) => t.status === "Arrange").length,
      Complete: userTasks.filter((t) => t.status === "Complete").length,
    };
  }, [tasks, user]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not scheduled";
    const date = new Date(dateString);

    const day = date.getUTCDate();
    const month = date.toLocaleString("default", {
      month: "short",
      timeZone: "UTC",
    });
    const year = date.getUTCFullYear();
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");

    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;

    return `${month} ${day}, ${year} • ${displayHours}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100'>
        <div className='text-center'>
          <Loader2
            className='animate-spin text-indigo-600 mx-auto mb-4'
            size={48}
          />
          <p className='text-slate-600 font-semibold'>
            Loading your deliveries...
          </p>
        </div>
      </div>
    );
  }

  const openMap = (location: string) => {
    const encoded = encodeURIComponent(location);
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encoded}`,
      "_blank",
    );
  };

  const handleUploadFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    id: number,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API}/upload/${id}/complete`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      alert("Upload successful!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50'>
      {/* Header Section */}
      <div className='bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-40 shadow-sm'>
        <div className='max-w-7xl mx-auto px-4 md:px-8 py-6'>
          <div className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
            {/* Title & Welcome */}
            <div className='flex items-center gap-4'>
              <div className='w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 relative overflow-hidden'>
                <div className='absolute inset-0 bg-white/10 backdrop-blur-sm'></div>
                <Truck
                  className='text-white relative z-10'
                  size={28}
                  strokeWidth={2.5}
                />
              </div>
              <div>
                <h1 className='text-2xl md:text-3xl font-black text-slate-800 tracking-tight'>
                  My Deliveries
                </h1>
                <p className='text-slate-500 text-sm font-medium mt-0.5'>
                  Welcome back,{" "}
                  <span className='text-indigo-600 font-bold'>
                    {user?.nameUse || user?.name}
                  </span>
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className='relative w-full md:w-80'>
              <Search
                className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400'
                size={18}
              />
              <input
                placeholder='Search company, location, item...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-sm font-medium shadow-sm'
              />
            </div>
          </div>

          {/* Status Filter Buttons */}
          <div className='flex gap-3 mt-6'>
            {/* Arranging Button */}
            <button
              onClick={() => setSelectedStatus("Arrange")}
              className={`flex items-center gap-3 px-6 py-3.5 rounded-xl font-bold transition-all duration-300 ${
                selectedStatus === "Arrange"
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200 scale-105"
                  : "bg-white text-slate-600 hover:bg-blue-50 border-2 border-slate-200 hover:border-blue-200"
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  selectedStatus === "Arrange" ? "bg-white/20" : "bg-blue-100"
                }`}
              >
                <ListTodo
                  size={20}
                  className={
                    selectedStatus === "Arrange"
                      ? "text-white"
                      : "text-blue-600"
                  }
                />
              </div>
              <div className='text-left'>
                <p className='text-xs opacity-80 font-semibold uppercase tracking-wider'>
                  Arranging
                </p>
                <p className='text-2xl font-black'>{statusCounts.Arrange}</p>
              </div>
            </button>

            {/* Completed Button */}
            <button
              onClick={() => setSelectedStatus("Complete")}
              className={`flex items-center gap-3 px-6 py-3.5 rounded-xl font-bold transition-all duration-300 ${
                selectedStatus === "Complete"
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-200 scale-105"
                  : "bg-white text-slate-600 hover:bg-emerald-50 border-2 border-slate-200 hover:border-emerald-200"
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  selectedStatus === "Complete" ? "bg-white/20" : "bg-emerald-100"
                }`}
              >
                <CheckCheck
                  size={20}
                  className={
                    selectedStatus === "Complete"
                      ? "text-white"
                      : "text-emerald-600"
                  }
                />
              </div>
              <div className='text-left'>
                <p className='text-xs opacity-80 font-semibold uppercase tracking-wider'>
                  Completed
                </p>
                <p className='text-2xl font-black'>{statusCounts.Complete}</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className='max-w-7xl mx-auto px-4 md:px-8 py-8'>
        {/* Status Indicator */}
        <div className='mb-6'>
          <div className='inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm'>
            <div
              className={`w-2 h-2 rounded-full ${
                selectedStatus === "Arrange" ? "bg-blue-500" : "bg-emerald-500"
              } animate-pulse`}
            ></div>
            <span className='text-sm font-bold text-slate-700'>
              Showing {filteredTasks.length}{" "}
              {selectedStatus === "Arrange" ? "Arranging" : "Completed"}{" "}
              {filteredTasks.length === 1 ? "Task" : "Tasks"}
            </span>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className='text-center py-20'>
            <div className='inline-flex p-6 rounded-full bg-slate-100 mb-4'>
              {selectedStatus === "Arrange" ? (
                <ListTodo size={48} className='text-slate-300' />
              ) : (
                <CheckCheck size={48} className='text-slate-300' />
              )}
            </div>
            <h3 className='text-xl font-bold text-slate-600 mb-2'>
              No {selectedStatus === "Arrange" ? "arranging" : "completed"}{" "}
              deliveries
            </h3>
            <p className='text-slate-400'>
              {searchTerm
                ? "Try adjusting your search"
                : `You don't have any ${selectedStatus === "Arrange" ? "arranging" : "completed"} deliveries yet`}
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {filteredTasks.map((t) => {
              const statusConfig =
                STATUS_CONFIG[t.status] || STATUS_CONFIG["Waiting"];
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={t.id}
                  className='group relative bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-200/60 hover:border-indigo-200 hover:-translate-y-1'
                >
                  {/* Gradient Background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${statusConfig.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  ></div>

                  {/* Truck Icon Watermark */}
                  <div className='absolute right-0 top-0 w-32 h-32 -mr-8 -mt-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500'>
                    <Truck size={128} strokeWidth={1.5} className='rotate-12' />
                  </div>

                  {/* Content Container */}
                  <div className='relative z-10 p-6'>
                    {/* Header: Status Badge */}
                    <div className='flex justify-between items-center mb-5'>
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black tracking-wider ${statusConfig.bg} ${statusConfig.color}`}
                      >
                        <StatusIcon size={14} />
                        {statusConfig.label.toUpperCase()}
                        <span
                          className={`w-2 h-2 rounded-full ${statusConfig.dot} animate-pulse`}
                        ></span>
                      </div>
                      <span className='text-slate-400 text-xs font-mono font-bold bg-slate-50 px-2 py-1 rounded-lg'>
                        #{String(t.id).padStart(4, "0")}
                      </span>
                    </div>

                    {/* Route Section */}
                    <div className='mb-5 space-y-3'>
                      {/* From */}
                      <div className='flex items-center gap-2.5'>
                        <div className='flex-shrink-0 w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition-colors'>
                          <Building2
                            size={16}
                            className='text-slate-500 group-hover:text-indigo-600 transition-colors'
                          />
                        </div>
                        <div
                          className='flex-1 min-w-0 cursor-pointer'
                          onClick={() => openMap(t.from)}
                        >
                          <p className='text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5'>
                            From
                          </p>
                          <p className='text-sm font-bold text-slate-700 truncate hover:underline'>
                            {t.from}
                          </p>
                        </div>
                      </div>

                      {/* Arrow Separator */}
                      <div className='flex items-center justify-center'>
                        <ArrowRight size={20} className='text-indigo-300' />
                      </div>

                      {/* To (Destination - Highlighted) */}
                      <div className='bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-4 rounded-xl border border-indigo-200/60 shadow-sm'>
                        <div className='flex items-start gap-3'>
                          <div className='flex-shrink-0 w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200'>
                            <MapPin
                              size={20}
                              className='text-white'
                              strokeWidth={2.5}
                            />
                          </div>
                          <div className='flex-1 min-w-0'>
                            <p className='text-[10px] font-black text-indigo-600 uppercase tracking-wider mb-1'>
                              Destination
                            </p>
                            <h3
                              className='text-base font-black text-slate-900 mb-1 leading-tight hover:underline cursor-pointer'
                              onClick={() => openMap(t.companyName)}
                            >
                              {t.companyName}
                            </h3>
                            <p
                              className='text-xs text-indigo-700/80 font-semibold leading-relaxed hover:underline cursor-pointer'
                              onClick={() => openMap(t.location)}
                            >
                              {t.location}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Item Description */}
                    <div className='mb-5 bg-slate-50 rounded-xl p-4 border border-slate-100'>
                      <div className='flex items-start gap-3'>
                        <Package
                          size={18}
                          className='shrink-0 text-indigo-500 mt-0.5'
                          strokeWidth={2}
                        />
                        <div className='flex-1 min-w-0'>
                          <p className='text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1'>
                            Item Details
                          </p>
                          <p className='text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-line line-clamp-3'>
                            {t.item}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className='grid grid-cols-1 gap-3 mb-5'>
                      {/* Schedule */}
                      <div className='flex items-center gap-3 bg-gradient-to-r from-slate-50 to-transparent p-3 rounded-lg'>
                        <div className='flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center'>
                          <Clock size={16} className='text-indigo-600' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <p className='text-[9px] font-black text-slate-400 uppercase tracking-wider'>
                            Scheduled
                          </p>
                          <p className='text-xs font-bold text-slate-700'>
                            {formatDate(t.scheduledAt)}
                          </p>
                        </div>
                      </div>

                      {t.phoneNumber && (
                        <div className='flex items-center gap-3 bg-gradient-to-r from-slate-50 to-transparent p-3 rounded-lg'>
                          <div className='flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center'>
                            <Phone size={16} className='text-emerald-600' />
                          </div>
                          <div className='flex-1 min-w-0'>
                            <p className='text-[9px] font-black text-slate-400 uppercase tracking-wider'>
                              Contact
                            </p>

                            {/* 修正点：将属性移入 <a> 标签，使用正确的 JSX 语法 */}
                            <a
                              href={`tel:${t.phoneNumber}`}
                              className='text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline'
                            >
                              {t.phoneNumber}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Document Actions Container */}
                    <div className='flex flex-col gap-2 pt-4 border-t border-slate-100 relative z-10'>
                      {/* View Buttons Row */}
                      <div className='grid grid-cols-3 gap-2'>
                        {/* INSTALL BUTTON */}
                        <button
                          onClick={() =>
                            handleViewDocument(t.id, "installation")
                          }
                          disabled={!t.hasInstallationForm}
                          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-black rounded-xl transition-all active:scale-95 ${
                            t.hasInstallationForm
                              ? "text-indigo-700 bg-indigo-50 border-2 border-indigo-200 hover:bg-indigo-100"
                              : "text-slate-300 bg-slate-50 border-2 border-slate-100 cursor-not-allowed"
                          }`}
                        >
                          <FileText size={14} /> INSTALL
                        </button>

                        {/* DO BUTTON */}
                        <button
                          onClick={() => handleViewDocument(t.id, "do")}
                          disabled={!t.hasDo}
                          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-black rounded-xl transition-all active:scale-95 ${
                            t.hasDo
                              ? "text-emerald-700 bg-emerald-50 border-2 border-emerald-200 hover:bg-emerald-100"
                              : "text-slate-300 bg-slate-50 border-2 border-slate-100 cursor-not-allowed"
                          }`}
                        >
                          <FileText size={14} /> D.O.
                        </button>

                        {/* COMPLETE/VIEW BUTTON */}
                        <button
                          onClick={() => handleViewDocument(t.id, "complete")}
                          disabled={!t.hasComplete}
                          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-black rounded-xl transition-all active:scale-95 ${
                            t.hasComplete
                              ? "text-blue-700 bg-blue-50 border-2 border-blue-200 hover:bg-blue-100"
                              : "text-slate-300 bg-slate-50 border-2 border-slate-100 cursor-not-allowed"
                          }`}
                        >
                          <FileText size={14} /> VIEW
                        </button>
                      </div>

                      {/* UPLOAD SECTION */}
                      <input
                        type='file'
                        accept='image/*,application/pdf'
                        id={`upload-${t.id}`}
                        className='hidden'
                        onChange={(e) => handleUploadFile(e, t.id)}
                      />
                      <button
                        onClick={() =>
                          document.getElementById(`upload-${t.id}`)?.click()
                        }
                        className='w-full flex items-center justify-center gap-2 py-3 text-xs font-black rounded-xl transition-all active:scale-95 text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-200'
                      >
                        <Upload size={16} /> UPLOAD / REPLACE
                      </button>
                    </div>
                  </div>

                  {/* Hover Glow Effect */}
                  <div className='absolute inset-0 rounded-2xl ring-2 ring-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none'></div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
