"use client";

import React, { useState, useEffect } from "react";
import {
  Upload,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  Loader2,
  FileSpreadsheet,
  RefreshCw,
  Download,
  ArrowLeft,
} from "lucide-react";

// Define the API Base using your environment variable
const API_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/InvData`;

interface InvData {
  id: number;
  companyName: string;
  address: string;
  debtorCode: string;
  phone: string;
  fax: string;
}

export default function InvCustomerPage() {
  const [data, setData] = useState<InvData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const pageSize = 10;

  // 1. Fetch Data (Optimized Pagination)
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}?page=${page}&pageSize=${pageSize}`,
      );
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();

      // Matches the backend structure: { totalCount: X, data: [...] }
      setData(result.data || []);
      setTotalCount(result.totalCount || 0);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  // 2. Handle Excel Upload (Wipes data & Restarts ID at 1)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const response = await fetch(`${API_BASE}/upload-excel`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Success: Database replaced and IDs reset to 1.");
        setPage(1);
        fetchData();
      } else {
        const err = await response.text();
        alert("Upload failed: " + err);
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
      e.target.value = ""; // Clear input for next use
    }
  };

  // 3. Handle Delete
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure? This will permanently delete this customer."))
      return;

    try {
      const response = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      if (response.ok) fetchData();
    } catch (error) {
      alert("Delete failed.");
    }
  };
  const handleExport = () => {
    window.location.href = `${API_BASE}/export-excel`;
  };
  return (
    <div className='min-h-screen bg-[#FFFBEB] p-6 md:p-12 '>
      <div className='max-w-6xl mx-auto'>
        {/* Header Section */}
        <div className='flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6'>
          <div className='flex items-center gap-6'>
            {/* Clean Back Button */}
            <button
              onClick={() => (window.location.href = "/InvoiceGenerator")}
              className='group relative flex items-center gap-2 text-slate-500 hover:text-amber-600 transition-colors duration-300 font-medium'
            >
              <ArrowLeft
                size={18}
                className='group-hover:-translate-x-1 transition-transform duration-300'
              />
              <span className='relative'>
                BACK
                <span className='absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 transition-all duration-300 group-hover:w-full'></span>
              </span>
            </button>

            <div className='h-8 w-[1px] bg-slate-200 hidden md:block'></div>

            <div>
              <h1 className='text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3'>
                <Users className='text-amber-600' size={32} />
                <span className='bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500'>
                  Customer Master
                </span>
              </h1>
            </div>
          </div>
          <div className='flex items-center gap-6'>
            {/* Refresh Button - Minimalist */}
            <button
              onClick={() => fetchData()}
              className='p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-all duration-300'
              title='Refresh Data'
            >
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
            {/* Export Button - Underline Effect */}
            <button
              onClick={handleExport}
              className='group relative py-2 flex items-center gap-2 text-indigo-600 font-bold tracking-widest text-xs transition-colors duration-300'
            >
              <Download
                size={18}
                className='group-hover:-translate-y-0.5 transition-transform duration-300'
              />
              <span className='relative'>
                EXPORT EXCEL
                <span className='absolute -bottom-1 left-0 w-0 h-[2px] bg-indigo-600 transition-all duration-500 ease-out group-hover:w-full'></span>
              </span>
            </button>

            {/* Import Button - Elevated Design */}
            <label className='group relative py-2 flex items-center gap-2 text-emerald-600 font-bold tracking-widest text-xs cursor-pointer transition-colors duration-300'>
              {uploading ? (
                <Loader2 className='animate-spin' size={18} />
              ) : (
                <FileSpreadsheet
                  size={18}
                  className='group-hover:rotate-12 transition-transform duration-300'
                />
              )}
              <span className='relative'>
                {uploading ? "PROCESSING..." : "IMPORT DATA"}
                <span className='absolute -bottom-1 left-0 w-0 h-[2px] bg-emerald-600 transition-all duration-500 ease-out group-hover:w-full'></span>
              </span>
              <input
                type='file'
                accept='.xlsx, .xls'
                className='hidden'
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {/* Data Container */}
        <div className='bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-left border-collapse table-auto'>
              <thead>
                <tr className='bg-slate-50/80 border-b border-slate-100'>
                  <th className='p-5 font-bold text-slate-400 text-xs uppercase tracking-widest w-20'>
                    ID
                  </th>
                  <th className='p-5 font-bold text-slate-900 w-40'>
                    Debtor Code
                  </th>
                  <th className='p-5 font-bold text-slate-900 w-48'>Company</th>
                  <th className='p-5 font-bold text-slate-900'>Address</th>
                  <th className='p-5 font-bold text-slate-900 w-40 text-center w-54'>
                    Contact Info
                  </th>{" "}
                  {/* 合并标题或保持分开 */}
                  <th className='p-5 font-bold text-slate-900 text-center w-24'>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className='divide-y divide-slate-50'>
                {loading && data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className='p-20 text-center'>
                      <Loader2
                        className='animate-spin mx-auto text-amber-500'
                        size={40}
                      />
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr
                      key={item.id}
                      className='group hover:bg-slate-50/50 transition-colors'
                    >
                      {/* 1. ID - 灰淡色 */}
                      <td className='p-5 text-slate-400 font-mono text-xs'>
                        #{item.id}
                      </td>

                      {/* 2. Debtor Code - 加粗 */}
                      <td className='p-5'>
                        <span className='font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded text-sm'>
                          {item.debtorCode}
                        </span>
                      </td>

                      {/* 3. Company Name */}
                      <td className='p-5 font-semibold text-slate-800 text-sm'>
                        {item.companyName}
                      </td>

                      {/* 4. Address - 优化排版 */}
                      <td className='p-5'>
                        <p className='text-slate-500 text-xs leading-relaxed whitespace-pre-line max-w-md border-l-2 border-slate-100 pl-3'>
                          {item.address || "No address provided"}
                        </p>
                      </td>

                      {/* 5. Phone & Fax - 垂直堆叠更整齐 */}
                      <td className='p-5 text-left'>
                        <div className='inline-flex flex-col gap-1 items-start text-xs'>
                          <div className='flex items-center gap-2 text-slate-600'>
                            <span className='text-[10px] bg-indigo-50 text-indigo-500 font-bold px-1 rounded uppercase'>
                              PHONE
                            </span>
                            <span>{item.phone || "-"}</span>
                          </div>
                          <div className='flex items-center gap-2 text-slate-400'>
                            <span className='text-[10px] bg-slate-100 text-slate-500 font-bold px-1 rounded uppercase'>
                              FAX
                            </span>
                            <span>{item.fax || "-"}</span>
                          </div>
                        </div>
                      </td>

                      {/* 6. Actions */}
                      <td className='p-5 text-center'>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className='p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100'
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Minimal Pagination */}
          <div className='p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between'>
            <p className='text-sm font-medium text-slate-500'>
              Total Customers:{" "}
              <span className='text-slate-900'>{totalCount}</span>
            </p>
            <div className='flex items-center gap-4'>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className='p-2 bg-white border border-slate-200 rounded-xl shadow-sm disabled:opacity-30 hover:border-amber-400 transition-all'
              >
                <ChevronLeft size={20} />
              </button>
              <span className='text-sm font-bold text-slate-700'>
                Page {page}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * pageSize >= totalCount}
                className='p-2 bg-white border border-slate-200 rounded-xl shadow-sm disabled:opacity-30 hover:border-amber-400 transition-all'
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
