"use client";

import { Truck, RefreshCw, Sparkles, Plus, Archive } from "lucide-react";

interface PageHeaderProps {
  refreshing: boolean;
  onRefresh: () => void;
  onOcrFileSelected: (file: File) => void;
  onNewTaskClick: () => void;
  isExporting: boolean;
  onExport: () => void;
}

export function PageHeader({
  refreshing,
  onRefresh,
  onOcrFileSelected,
  onNewTaskClick,
  isExporting,
  onExport,
}: PageHeaderProps) {
  return (
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
              onClick={onRefresh}
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
                if (file) onOcrFileSelected(file);
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
              onClick={onNewTaskClick}
              className='flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-md shadow-indigo-200'
            >
              <Plus size={16} />
              New Task
            </button>

            <button
              onClick={onExport}
              disabled={isExporting}
              className={`flex items-center gap-2 px-4 py-2.5 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-md 
                ${isExporting ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"}`}
            >
              <Archive size={16} className={isExporting ? "animate-spin" : ""} />
              {isExporting ? "Packaging..." : "Generate Record"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
