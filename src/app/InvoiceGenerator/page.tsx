"use client";

import React, { useState, ChangeEvent } from 'react';
import { Paperclip, Upload, Building2, Percent, MapPin, Download, Loader2, Phone, Printer, CheckCircle2 } from 'lucide-react';

const InvoiceGenerator = () => {
  const [file, setFile] = useState<File | null>(null);
  const [companyKey, setCompanyKey] = useState<string>('ARENA');
  const [increasePercentage, setIncreasePercentage] = useState<number>(0);
  const [secondInvoiceCompanyName, setSecondInvoiceCompanyName] = useState<string>('');
  const [secondInvoiceAddress, setSecondInvoiceAddress] = useState<string>('');
  const [secondInvoiceTel, setSecondInvoiceTel] = useState<string>('');
  const [secondInvoiceFax, setSecondInvoiceFax] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!file) {
      alert("Please upload an Excel file first!");
      return;
    }

    if (!companyKey || !secondInvoiceCompanyName.trim() || !secondInvoiceAddress.trim()) {
      alert("Please fill in all required fields!");
      return;
    }

    setLoading(true);
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('secondInvoiceCompanyName', secondInvoiceCompanyName);
    formData.append('secondInvoiceAddress', secondInvoiceAddress);
    formData.append('secondInvoiceTel', secondInvoiceTel);
    formData.append('secondInvoiceFax', secondInvoiceFax);
    formData.append('increasePercentage', increasePercentage.toString());
    try {
      const response = await fetch(
        `${API_BASE}/api/InvoiceTest/export-docx?companyKey=${companyKey}`, 
        { method: 'POST', body: formData }
      );

      if (!response.ok) throw new Error(`Server error: ${response.statusText}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoices_${companyKey}_${new Date().getTime()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Error generating invoice. Please check the network or backend.");
    } finally {
      setLoading(false);
    }
  };

  // 必填项逻辑：File, Name, Address
  const isFormIncomplete = !file || !companyKey || !secondInvoiceCompanyName.trim() || !secondInvoiceAddress.trim();

  return (
    <div className="min-h-screen bg-[#FFFBEB] py-12 px-4 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto">
        
        {/* Header Area */}
        <div className="text-center mb-12">
          <div className="inline-flex p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl shadow-xl mb-6">
            <Paperclip className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-amber-900 tracking-tight">Invoice Processing Hub</h1>
          <p className="text-amber-700/60 mt-2 font-medium">Follow the steps below to generate your documents</p>
        </div>

        <div className="space-y-8">
          
          {/* STEP 1: UPLOAD */}
          <section className="relative bg-white rounded-3xl p-8 shadow-sm border border-amber-100 transition-all hover:shadow-md">
            <div className="absolute -left-3 -top-3 w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold shadow-lg border-4 border-[#FFFBEB]">1</div>
            <label className="flex items-center gap-2 text-sm font-bold text-amber-600 uppercase tracking-widest mb-6">
              <Upload size={18} /> Step 1: Upload Excel
            </label>
            <div className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all ${file ? 'border-green-400 bg-green-50/20' : 'border-amber-200 hover:border-amber-400'}`}>
              <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept=".xlsx" />
              {file ? <CheckCircle2 className="text-green-500 mb-2" size={40} /> : <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4"><Upload className="text-amber-600" size={24} /></div>}
              <p className="text-amber-900 font-semibold text-center">{file ? file.name : "Select Excel File (.xlsx)"}</p>
            </div>
          </section>

          {/* STEP 2: CONFIGURATION */}
          <section className="relative bg-white rounded-3xl p-8 shadow-sm border border-amber-100 transition-all hover:shadow-md">
            <div className="absolute -left-3 -top-3 w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold shadow-lg border-4 border-[#FFFBEB]">2</div>
            <label className="flex items-center gap-2 text-sm font-bold text-amber-600 uppercase tracking-widest mb-6">
              <Building2 size={18} /> Step 2: Company B and Increase Rate
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-amber-400 uppercase">Select Template Template</span>
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
                <span className="text-[10px] font-black text-amber-400 uppercase">Price Adjustment (%)</span>
                <div className="relative">
                  <input type="number" value={increasePercentage} onChange={(e) => setIncreasePercentage(Number(e.target.value))} className="w-full bg-amber-50/50 border border-amber-100 rounded-xl px-4 py-3 text-amber-900 outline-none focus:ring-2 focus:ring-orange-400" />
                  <span className="absolute right-4 top-3 text-amber-400 font-bold">%</span>
                </div>
              </div>
            </div>
          </section>

          {/* STEP 3: OVERRIDE DETAILS */}
          <section className="relative bg-white rounded-3xl p-8 shadow-sm border border-amber-100 transition-all hover:shadow-md">
            <div className="absolute -left-3 -top-3 w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold shadow-lg border-4 border-[#FFFBEB]">3</div>
            <label className="flex items-center gap-2 text-sm font-bold text-amber-600 uppercase tracking-widest mb-6">
              <MapPin size={18} /> Step 3: Customer Company Details
            </label>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <span className="text-[10px] font-black text-amber-400 uppercase">2nd Company Name *</span>
                  <input value={secondInvoiceCompanyName} onChange={(e) => setSecondInvoiceCompanyName(e.target.value)} className="w-full border-b border-amber-100 py-2 outline-none focus:border-orange-500 text-sm text-amber-900" placeholder="e.g. ABC SDN BHD" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="flex items-center gap-1 text-[10px] font-black text-amber-400 uppercase"><Phone size={10}/> Tel (Opt)</span>
                    <input value={secondInvoiceTel} onChange={(e) => setSecondInvoiceTel(e.target.value)} className="w-full border-b border-amber-100 py-2 outline-none focus:border-orange-500 text-sm text-amber-900" placeholder="012-xxx" />
                  </div>
                  <div>
                    <span className="flex items-center gap-1 text-[10px] font-black text-amber-400 uppercase"><Printer size={10}/> Fax (Opt)</span>
                    <input value={secondInvoiceFax} onChange={(e) => setSecondInvoiceFax(e.target.value)} className="w-full border-b border-amber-100 py-2 outline-none focus:border-orange-500 text-sm text-amber-900" placeholder="07-xxx" />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-black text-amber-400 uppercase">2nd Delivery Address *</span>
                  <textarea value={secondInvoiceAddress} onChange={(e) => setSecondInvoiceAddress(e.target.value)} rows={3} className="w-full bg-amber-50/30 border border-amber-100 rounded-xl p-4 mt-2 outline-none focus:ring-2 focus:ring-orange-400 text-sm" placeholder="Full address here..." />
                </div>
              </div>
            </div>
          </section>

          {/* FINAL ACTION */}
          <div className="pt-4">
            <button 
                onClick={handleGenerate}
                disabled={loading || isFormIncomplete}
                className={`
                    relative w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 
                    transition-all duration-300 tracking-widest text-sm border-2
                    ${
                    loading || isFormIncomplete 
                    ? 'bg-amber-50/50 text-amber-200 border-amber-100 cursor-not-allowed' 
                    : 'bg-white text-amber-900 border-amber-900 hover:bg-amber-900 hover:text-white active:scale-[0.98] shadow-[4px_4px_0px_0px_rgba(120,67,21,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
                    }
                `}
                >
                {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                ) : (
                    <Download size={20} />
                )}
                
                <span>
                    {loading ? 'PROCESSING...' : isFormIncomplete ? 'COMPLETE STEPS' : 'GENERATE INVOICES'}
                </span>
            </button>
            {isFormIncomplete && !loading && (
               <p className="text-center text-orange-500 text-xs font-bold mt-4 animate-pulse">
                 ⚠️ PLEASE COMPLETE ALL STEPS ABOVE
               </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;