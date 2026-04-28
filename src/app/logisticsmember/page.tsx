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
} from "lucide-react";

const API = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Logistics`;

export default function LogisticsPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Function to view PDF
  const handleViewDocument = async (
    id: number,
    type: "installation" | "do" | "complete",
  ) => {
    try {
      // 👇 OPEN IMMEDIATELY (important!)
      const newWindow = window.open("", "_blank");

      const res = await fetch(`${API}/view/${id}/${type}`);
      if (!res.ok) throw new Error("Document not available");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      // 👇 LOAD INTO OPENED WINDOW
      if (newWindow) {
        newWindow.location.href = url;
      } else {
        // fallback if popup blocked
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
      const matchesStatus =
        selectedStatus === "all" || t.status === selectedStatus;

      return matchesPIC && matchesSearch && matchesStatus;
    });
  }, [tasks, user, searchTerm, selectedStatus]);

  const statusCounts = useMemo(() => {
    const userTasks = tasks.filter(
      (t) => t.picDeliver === user?.name || t.picDeliver === user?.nameUse,
    );

    return {
      all: userTasks.length,
      Waiting: userTasks.filter((t) => t.status === "Waiting").length,
      Arrange: userTasks.filter((t) => t.status === "Arrange").length,
      Delivering: userTasks.filter((t) => t.status === "Delivering").length,
      Done: userTasks.filter((t) => t.status === "Done").length,
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
        </div>
      </div>

      {/* Cards Grid */}
      <div className='max-w-7xl mx-auto px-4 md:px-8 py-8'>
        {filteredTasks.length === 0 ? (
          <div className='text-center py-20'>
            <div className='inline-flex p-6 rounded-full bg-slate-100 mb-4'>
              <Package size={48} className='text-slate-300' />
            </div>
            <h3 className='text-xl font-bold text-slate-600 mb-2'>
              No deliveries found
            </h3>
            <p className='text-slate-400'>
              {searchTerm || selectedStatus !== "all"
                ? "Try adjusting your filters"
                : "You don't have any assigned deliveries yet"}
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {filteredTasks.map((t) => {
              return (
                <div
                  key={t.id}
                  className='group relative bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-200/60 hover:border-indigo-200 hover:-translate-y-1'
                >
                  {/* Truck Icon Watermark */}
                  <div className='absolute right-0 top-0 w-32 h-32 -mr-8 -mt-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500'>
                    <Truck size={128} strokeWidth={1.5} className='rotate-12' />
                  </div>

                  {/* Content Container */}
                  <div className='relative z-10 p-6'>
                    {/* Header: Status & ID */}

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

                            {/* COMPANY NAME → search company */}
                            <h3
                              className='text-base font-black text-slate-900 mb-1 leading-tight hover:underline cursor-pointer'
                              onClick={() => openMap(t.companyName)}
                            >
                              {t.companyName}
                            </h3>

                            {/* LOCATION → search location */}
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

                      {/* Phone */}
                      {t.phoneNumber && (
                        <div className='flex items-center gap-3 bg-gradient-to-r from-slate-50 to-transparent p-3 rounded-lg'>
                          <div className='flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center'>
                            <Phone size={16} className='text-emerald-600' />
                          </div>
                          <div className='flex-1 min-w-0'>
                            <p className='text-[9px] font-black text-slate-400 uppercase tracking-wider'>
                              Contact
                            </p>
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

                    {/* Document Buttons */}
                    <div className='flex flex-col gap-2 pt-4 border-t border-slate-100 relative z-10'>
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
                                ? "text-indigo-700 bg-indigo-50 border-2 border-indigo-200"
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
                                ? "text-emerald-700 bg-emerald-50 border-2 border-emerald-200"
                                : "text-slate-300 bg-slate-50 border-2 border-slate-100 cursor-not-allowed"
                            }`}
                          >
                            <FileText size={14} /> D.O.
                          </button>

                          {/* NEW: COMPLETE/VIEW BUTTON */}
                          <button
                            onClick={() => handleViewDocument(t.id, "complete")}
                            disabled={!t.hasComplete} // Ensure your API returns 'hasComplete' field
                            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-black rounded-xl transition-all active:scale-95 ${
                              t.hasComplete
                                ? "text-blue-700 bg-blue-50 border-2 border-blue-200"
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
                          className='w-full flex items-center justify-center gap-2 py-3 text-xs font-black rounded-xl transition-all active:scale-95 text-white bg-blue-600 hover:bg-blue-700'
                        >
                          <Upload size={16} /> UPLOAD / REPLACE
                        </button>
                      </div>
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
