"use client";

import React, { useState, ChangeEvent } from 'react';
import { 
  Paperclip, Upload, Building2, MapPin, Download, 
  Loader2, Phone, Printer, CheckCircle2, FileText, X 
} from 'lucide-react';

const InvoiceGenerator = () => {
  // --- 状态管理：改为支持多文件 ---
  const [files, setFiles] = useState<File[]>([]);
  const [companyKey, setCompanyKey] = useState<string>('ARENA');
  const [increasePercentage, setIncreasePercentage] = useState<number>(0);
  const [secondInvoiceCompanyName, setSecondInvoiceCompanyName] = useState<string>('');
  const [secondInvoiceAddress, setSecondInvoiceAddress] = useState<string>('');
  const [secondInvoiceTel, setSecondInvoiceTel] = useState<string>('');
  const [secondInvoiceFax, setSecondInvoiceFax] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // --- 处理文件选择 (支持多选和去重) ---
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(f => 
        f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
      );
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // --- 核心生成逻辑 ---
  const handleGenerate = async () => {
    if (files.length === 0) {
      alert("Please upload at least one Excel file!");
      return;
    }

    if (!companyKey || !secondInvoiceCompanyName.trim() || !secondInvoiceAddress.trim()) {
      alert("Please fill in Step 2 and Step 3 details!");
      return;
    }

    setLoading(true);
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

    const formData = new FormData();
    // 💡 关键：循环添加所有文件到同一个 Key "files"
    files.forEach((f) => formData.append('files', f));
    
    formData.append('secondInvoiceCompanyName', secondInvoiceCompanyName);
    formData.append('secondInvoiceAddress', secondInvoiceAddress);
    formData.append('secondInvoiceTel', secondInvoiceTel);
    formData.append('secondInvoiceFax', secondInvoiceFax);
    formData.append('increasePercentage', increasePercentage.toString());

    try {
      // 💡 这里的 URL 改为你后端的批量接口名
      const response = await fetch(
        `${API_BASE}/api/InvoiceTest/export-docx-bulk?companyKey=${companyKey}`, 
        { method: 'POST', body: formData }
      );

      if (!response.ok) throw new Error(`Server error: ${response.statusText}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bulk_Invoices_${new Date().getTime()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      // 完成后清空文件列表（可选）
      // setFiles([]);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Error generating invoices. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  const isFormIncomplete = files.length === 0 || !secondInvoiceCompanyName.trim() || !secondInvoiceAddress.trim();

  return (
    <div className="min-h-screen bg-[#FFFBEB] py-12 px-4 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto">
        
        {/* Header Area */}
        <div className="text-center mb-12">
          <div className="inline-flex p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl shadow-xl mb-6 ring-8 ring-amber-100/50">
            <Paperclip className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-amber-900 tracking-tight">Invoice Processing Hub</h1>
          <p className="text-amber-700/60 mt-2 font-medium">Batch processing powered by Gemini Engine</p>
        </div>

        <div className="space-y-8">
          
          {/* STEP 1: BATCH UPLOAD */}
          <section className="relative bg-white rounded-3xl p-8 shadow-sm border border-amber-100 transition-all hover:shadow-md">
            <div className="absolute -left-3 -top-3 w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold shadow-lg border-4 border-[#FFFBEB]">1</div>
            <label className="flex items-center gap-2 text-sm font-bold text-amber-600 uppercase tracking-widest mb-6">
              <Upload size={18} /> Step 1: Upload Files / Folder
            </label>
            
            <div className="relative border-2 border-dashed border-amber-200 rounded-2xl p-8 hover:border-amber-400 transition-colors bg-amber-50/10 group">
              <input 
                type="file" 
                multiple 
                // @ts-ignore - 文件夹上传属性
                webkitdirectory="" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                onChange={handleFileChange} 
                accept=".xlsx, .xls" 
              />
              <div className="flex flex-col items-center justify-center pointer-events-none">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="text-amber-600" size={28} />
                </div>
                <p className="text-amber-900 font-bold">Drop Excel Files or Click to Select Folder</p>
                <p className="text-amber-400 text-xs mt-1">Supports multiple .xlsx files at once</p>
              </div>
            </div>

            {/* --- 文件列表预览 --- */}
            {files.length > 0 && (
              <div className="mt-6 space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-amber-200">
                {files.map((f, index) => (
                  <div key={index} className="flex items-center justify-between bg-amber-50/50 p-3 rounded-xl border border-amber-100 group animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-3">
                      <FileText className="text-amber-500" size={18} />
                      <span className="text-sm font-medium text-amber-900 truncate max-w-[200px] md:max-w-[400px]">{f.name}</span>
                    </div>
                    <button onClick={() => removeFile(index)} className="p-1 hover:bg-red-100 rounded-full text-red-400 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* STEP 2: CONFIGURATION (保持不变) */}
          <section className="relative bg-white rounded-3xl p-8 shadow-sm border border-amber-100">
            <div className="absolute -left-3 -top-3 w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold shadow-lg border-4 border-[#FFFBEB]">2</div>
            <label className="flex items-center gap-2 text-sm font-bold text-amber-600 uppercase tracking-widest mb-6">
              <Building2 size={18} /> Step 2: Processing Rules
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-tighter">Target Template</span>
                <select 
                  value={companyKey}
                  onChange={(e) => setCompanyKey(e.target.value)}
                  className="w-full bg-amber-50/50 border border-amber-100 rounded-xl px-4 py-3 text-amber-900 outline-none focus:ring-2 focus:ring-orange-400 appearance-none cursor-pointer"
                >
                  <option value="ARENA">ARENA STABIL</option>
                  <option value="ASN">ASN SETIA CETAK</option>
                  <option value="SKY">SKY ACTIVE</option>
                </select>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-tighter">Increase Rate (%)</span>
                <div className="relative">
                  <input type="number" value={increasePercentage} onChange={(e) => setIncreasePercentage(Number(e.target.value))} className="w-full bg-amber-50/50 border border-amber-100 rounded-xl px-4 py-3 text-amber-900 outline-none focus:ring-2 focus:ring-orange-400" />
                  <span className="absolute right-4 top-3 text-amber-400 font-bold">%</span>
                </div>
              </div>
            </div>
          </section>

          {/* STEP 3: CUSTOMER DETAILS (保持不变) */}
          <section className="relative bg-white rounded-3xl p-8 shadow-sm border border-amber-100">
            <div className="absolute -left-3 -top-3 w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold shadow-lg border-4 border-[#FFFBEB]">3</div>
            <label className="flex items-center gap-2 text-sm font-bold text-amber-600 uppercase tracking-widest mb-6">
              <MapPin size={18} /> Step 3: Customer Information
            </label>
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-tighter">Client Company Name *</span>
                <input value={secondInvoiceCompanyName} onChange={(e) => setSecondInvoiceCompanyName(e.target.value)} className="w-full border-b-2 border-amber-50 py-2 outline-none focus:border-orange-500 text-sm text-amber-900 transition-colors" placeholder="e.g. MAJLIS PERBANDARAN PENGERANG" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="flex items-center gap-1 text-[10px] font-black text-amber-400 uppercase tracking-tighter"><Phone size={10}/> Phone</span>
                  <input value={secondInvoiceTel} onChange={(e) => setSecondInvoiceTel(e.target.value)} className="w-full border-b border-amber-100 py-2 outline-none text-sm" placeholder="016-xxx" />
                </div>
                <div>
                  <span className="flex items-center gap-1 text-[10px] font-black text-amber-400 uppercase tracking-tighter"><Printer size={10}/> Fax</span>
                  <input value={secondInvoiceFax} onChange={(e) => setSecondInvoiceFax(e.target.value)} className="w-full border-b border-amber-100 py-2 outline-none text-sm" placeholder="07-xxx" />
                </div>
              </div>
              <div>
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-tighter">Delivery Address *</span>
                <textarea value={secondInvoiceAddress} onChange={(e) => setSecondInvoiceAddress(e.target.value)} rows={3} className="w-full bg-amber-50/30 border border-amber-100 rounded-xl p-4 mt-2 outline-none focus:ring-2 focus:ring-orange-400 text-sm" placeholder="Paste address here..." />
              </div>
            </div>
          </section>

          {/* --- FINAL ACTION & LOADING UI --- */}
          <div className="pt-4">
            <button 
              onClick={handleGenerate}
              disabled={loading || isFormIncomplete}
              className={`
                relative w-full py-5 rounded-2xl font-black flex items-center justify-center gap-3 
                transition-all duration-300 tracking-[0.2em] text-sm border-b-8
                ${
                  loading || isFormIncomplete 
                  ? 'bg-amber-100 text-amber-300 border-amber-200 cursor-not-allowed' 
                  : 'bg-amber-500 text-white border-amber-700 hover:bg-amber-400 hover:-translate-y-1 active:translate-y-1 active:border-b-0 shadow-xl'
                }
              `}
            >
              {loading ? (
                <div className="flex items-center gap-4">
                  <Loader2 className="animate-spin" size={24} />
                  <span className="animate-pulse">PROCESSING {files.length} FILES...</span>
                </div>
              ) : (
                <>
                  <Download size={22} />
                  <span>GENERATE {files.length > 1 ? `${files.length} INVOICES` : 'INVOICE'}</span>
                </>
              )}
            </button>
            
            {/* 提示文案 */}
            {isFormIncomplete && !loading && (
               <div className="mt-4 flex items-center justify-center gap-2 text-orange-400 animate-bounce">
                  <CheckCircle2 size={14} className="opacity-50" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Awaiting Required Information</p>
               </div>
            )}
          </div>

        </div>
      </div>
      
      {/* 全屏 Loading Overlay (当处理大量文件时非常有用) */}
      {loading && (
        <div className="fixed inset-0 bg-amber-900/20 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 border-2 border-amber-500">
             <div className="relative">
                <Loader2 className="text-amber-500 animate-spin" size={60} />
                <div className="absolute inset-0 flex items-center justify-center">
                   <FileText size={20} className="text-amber-500" />
                </div>
             </div>
             <div className="text-center">
                <h3 className="text-amber-900 font-black tracking-widest uppercase">Zipping Documents</h3>
                <p className="text-amber-500 text-xs mt-1 font-bold">Please do not close the browser</p>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InvoiceGenerator;