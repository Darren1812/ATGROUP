"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Upload, 
  Download, 
  Plus, 
  Filter, 
  X, 
  FileSpreadsheet,
  Loader2,
  CheckCircle,
  AlertCircle,
  Edit2,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { useRouter } from "next/navigation";
const API = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/MdTable`;

interface MdTableDto {
  tenderNo: string;
  endUser?: string | null;
  state?: string | null;
  area?: string | null;
  marketing?: string | null;
  sales?: string | null;
  tenderCategory?: string | null;
  existingVendor?: string | null;
  existingBrand?: string | null;
  existingQuantity?: number | null;
  contractDuration?: string | null;
  contractEndDate?: string | null;
  expectedTenderOpenDate?: string | null;
  tenderOpenDate?: string | null;
  specsRequirement?: string | null;
  budget?: number | null;
  proposedBrand?: string | null;
  resultStatus?: string | null;
  awardedVendor?: string | null;
  awardedBrand?: string | null;
  awardedAmount?: number | null;
  awardedVariance?: string | null;
}

export default function TenderManagementPage() {
  const router = useRouter();
  const [data, setData] = useState<MdTableDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  
  // 🔍 扩展后的列过滤器状态
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({
    tenderNo: '',
    endUser: '',
    state: '',
    marketing: '',
    sales: '',
    awardedBrand: '',
    resultStatus: '',
    contractEndYear: '',       // image_aa43c5.png 中的 Contract End Date 年份筛选
    expectedTenderOpenYear: '', // image_aa43c5.png 中的 Expected Tender Open Date 年份筛选
    tenderOpenYear: ''          // image_aa43c5.png 中的 Tender Open Date 年份筛选
  });
  
  const [showFilterPanel, setShowFilterPanel] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [uploading, setUploading] = useState<boolean>(false);
  
  const initialFormState: Partial<MdTableDto> = {
    tenderNo: '',
    endUser: '',
    state: '',
    area: '',
    marketing: '',
    sales: '',
    tenderCategory: '',
    existingVendor: '',
    existingBrand: '',
    existingQuantity: null,
    contractDuration: '',
    contractEndDate: '',
    expectedTenderOpenDate: '',
    tenderOpenDate: '',
    specsRequirement: '',
    budget: null,
    proposedBrand: '',
    resultStatus: 'Pending',
    awardedVendor: '',
    awardedBrand: '',
    awardedAmount: null
  };

  const [formRecord, setFormRecord] = useState<Partial<MdTableDto>>(initialFormState);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchTenders = async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error('Failed to fetch data');
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error(error);
      showToast('Error loading database records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenders();
  }, []);

  // 动态提取现有数据里的所有可用年份，供下拉菜单使用
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    data.forEach(item => {
      if (item.contractEndDate) years.add(new Date(item.contractEndDate).getFullYear().toString());
      if (item.expectedTenderOpenDate) years.add(new Date(item.expectedTenderOpenDate).getFullYear().toString());
      if (item.tenderOpenDate) years.add(new Date(item.tenderOpenDate).getFullYear().toString());
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a)); // 降序排列
  }, [data]);

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', files[0]);

    try {
      const res = await fetch(`${API}/import`, { method: 'POST', body: formData });
      const result = await res.json();
      if (res.ok) {
        showToast(result.message || 'Excel imported successfully!', 'success');
        fetchTenders();
      } else {
        throw new Error(result.message || 'Import failed');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to import Excel.', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleExportExcel = () => {
    try {
      showToast('Generating Excel report...', 'success');
      window.location.href = `${API}/export`;
    } catch (error) {
      showToast('Export failed.', 'error');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRecord.tenderNo?.trim()) {
      showToast('Tender No. is required.', 'error');
      return;
    }

    const isEdit = modalMode === 'edit';
    const url = isEdit ? `${API}/${encodeURIComponent(formRecord.tenderNo)}` : API;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formRecord)
      });

      if (res.status === 409 && !isEdit) {
        showToast('Tender No. already exists!', 'error');
        return;
      }

      if (!res.ok) throw new Error('Failed to save record.');

      showToast(isEdit ? 'Record updated successfully.' : 'Record added successfully.', 'success');
      setIsModalOpen(false);
      setFormRecord(initialFormState);
      fetchTenders();
    } catch (error) {
      showToast('Error saving data row.', 'error');
    }
  };

  const handleDelete = async (tenderNo: string) => {
    if (!window.confirm(`Are you sure you want to delete Tender No: ${tenderNo}?`)) return;

    try {
      const res = await fetch(`${API}/${encodeURIComponent(tenderNo)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete row.');
      showToast('Record deleted successfully.', 'success');
      fetchTenders();
    } catch (error) {
      showToast('Error deleting row.', 'error');
    }
  };

  const openEditModal = (item: MdTableDto) => {
    setModalMode('edit');
    setFormRecord({
      ...item,
      contractEndDate: item.contractEndDate ? item.contractEndDate.split('T')[0] : '',
      expectedTenderOpenDate: item.expectedTenderOpenDate ? item.expectedTenderOpenDate.split('T')[0] : '',
      tenderOpenDate: item.tenderOpenDate ? item.tenderOpenDate.split('T')[0] : '',
    });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormRecord(initialFormState);
    setIsModalOpen(true);
  };

  // 🔍 核心多维度复合过滤网格
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // 1. 全局模糊搜索
      if (globalSearch.trim() !== '') {
        const searchLower = globalSearch.toLowerCase();
        const matchesGlobal = Object.values(item).some(val => 
          val !== null && val !== undefined && String(val).toLowerCase().includes(searchLower)
        );
        if (!matchesGlobal) return false;
      }

      // 2. 文本与状态过滤器 (包含新加的 State, Marketing, Sales, Awarded Brand)
      const textFilters = ['tenderNo', 'endUser', 'state', 'marketing', 'sales', 'awardedBrand', 'resultStatus'];
      for (const key of textFilters) {
        const filterValue = columnFilters[key];
        if (filterValue && filterValue.trim() !== '') {
          const itemValue = item[key as keyof MdTableDto];
          if (itemValue === null || itemValue === undefined) return false;
          if (!String(itemValue).toLowerCase().includes(filterValue.toLowerCase())) {
            return false;
          }
        }
      }

      // 3. 年份过滤器逻辑 (精准提取 image_aa43c5.png 中的 3 种 Date 并对比年份)
      if (columnFilters.contractEndYear) {
        if (!item.contractEndDate) return false;
        const y = new Date(item.contractEndDate).getFullYear().toString();
        if (y !== columnFilters.contractEndYear) return false;
      }

      if (columnFilters.expectedTenderOpenYear) {
        if (!item.expectedTenderOpenDate) return false;
        const y = new Date(item.expectedTenderOpenDate).getFullYear().toString();
        if (y !== columnFilters.expectedTenderOpenYear) return false;
      }

      if (columnFilters.tenderOpenYear) {
        if (!item.tenderOpenDate) return false;
        const y = new Date(item.tenderOpenDate).getFullYear().toString();
        if (y !== columnFilters.tenderOpenYear) return false;
      }

      return true;
    });
  }, [data, globalSearch, columnFilters]);

  const handleColumnFilterChange = (columnName: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [columnName]: value }));
  };

  const clearAllFilters = () => {
    setColumnFilters({
      tenderNo: '',
      endUser: '',
      state: '',
      marketing: '',
      sales: '',
      awardedBrand: '',
      resultStatus: '',
      contractEndYear: '',
      expectedTenderOpenYear: '',
      tenderOpenYear: ''
    });
    setGlobalSearch('');
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(amount).replace('MYR', 'RM');
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };
  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-800 font-sans">
      
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg text-white transition-all duration-300 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* 顶部操作条 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
      <div className="flex items-start gap-3">
          {/* 🌟 新增的返回按钮 */}
          <button 
            onClick={() => window.history.back()}
            className="mt-1 p-1.5 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 bg-white shadow-sm transition"
            title="Back to previous page"
          >
            <ArrowLeft size={16} /> {/* 注意：需要确保你从图标库（如 lucide-react）中引入了 ArrowLeft */}
          </button>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="text-indigo-600" />
              Master Tender Database
            </h1>
            <p className="text-sm text-slate-500 mt-1">Manage, import, export, and dynamically filter logistics department tender logs.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm transition">
            {uploading ? <Loader2 size={16} className="animate-spin text-slate-500" /> : <Upload size={16} className="text-slate-500" />}
            <span>{uploading ? 'Importing...' : 'Import Excel'}</span>
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportExcel} disabled={uploading} />
          </label>

          <button 
            onClick={handleExportExcel}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition"
          >
            <Download size={16} className="text-slate-500" />
            <span>Export Excel</span>
          </button>

          <button 
            onClick={openAddModal}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition"
          >
            <Plus size={16} />
            <span>Add Opportunity</span>
          </button>
        </div>
      </div>

      {/* 🔍 增强版高级条件搜索控制台 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Global fuzzy search everything here..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>
          
          <div className="flex w-full sm:w-auto items-center justify-end gap-2">
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center space-x-2 px-4 py-2 border rounded-lg text-sm font-medium transition ${showFilterPanel ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <Filter size={16} />
              <span>Advanced Filter Panel</span>
              {Object.values(columnFilters).filter(Boolean).length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-indigo-600 text-white rounded-full">
                  {Object.values(columnFilters).filter(Boolean).length}
                </span>
              )}
            </button>

            {(globalSearch || Object.values(columnFilters).filter(Boolean).length > 0) && (
              <button 
                onClick={clearAllFilters}
                className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-rose-600 hover:text-rose-700 transition"
              >
                <X size={14} />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        </div>

        {showFilterPanel && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4 pt-4 border-t border-slate-100">
            {/* 基础文本字段过滤 */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">State</label>
              <input type="text" value={columnFilters.state} onChange={(e) => handleColumnFilterChange('state', e.target.value)} className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Filter State..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Marketing</label>
              <input type="text" value={columnFilters.marketing} onChange={(e) => handleColumnFilterChange('marketing', e.target.value)} className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Filter Marketing..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Salesperson</label>
              <input type="text" value={columnFilters.sales} onChange={(e) => handleColumnFilterChange('sales', e.target.value)} className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Filter Salesperson..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Awarded Brand</label>
              <input type="text" value={columnFilters.awardedBrand} onChange={(e) => handleColumnFilterChange('awardedBrand', e.target.value)} className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Filter Brand..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Result Status</label>
              <select value={columnFilters.resultStatus} onChange={(e) => handleColumnFilterChange('resultStatus', e.target.value)} className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All Statuses</option>
                <option value="Win">Win</option>
                <option value="Lose">Lose</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            {/* 📅 基于 image_aa43c5.png 定义的 3 种日期的年份微调过滤 */}
            <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl col-span-2 md:col-span-4 lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
              <div>
                <label className="block text-xs font-bold text-amber-900 uppercase mb-1">📆 Contract End Year</label>
                <select value={columnFilters.contractEndYear} onChange={(e) => handleColumnFilterChange('contractEndYear', e.target.value)} className="w-full px-3 py-1.5 text-xs border border-amber-200 rounded-md bg-white focus:outline-none text-slate-700">
                  <option value="">All Years</option>
                  {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-emerald-900 uppercase mb-1">📆 Expected Tender Open Year</label>
                <select value={columnFilters.expectedTenderOpenYear} onChange={(e) => handleColumnFilterChange('expectedTenderOpenYear', e.target.value)} className="w-full px-3 py-1.5 text-xs border border-emerald-200 rounded-md bg-white focus:outline-none text-slate-700">
                  <option value="">All Years</option>
                  {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-indigo-900 uppercase mb-1">📆 Actual Tender Open Year</label>
                <select value={columnFilters.tenderOpenYear} onChange={(e) => handleColumnFilterChange('tenderOpenYear', e.target.value)} className="w-full px-3 py-1.5 text-xs border border-indigo-200 rounded-md bg-white focus:outline-none text-slate-700">
                  <option value="">All Years</option>
                  {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 数据明细表格 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[650px]">
          {/* 关键修改：将 border-collapse 改为 border-separate，并设置 border-spacing-0，这样能完美解决 sticky 列和表头的边框冲突问题 */}
          <table className="w-full text-left border-separate border-spacing-0 table-auto">
            <thead className="text-xs font-bold text-slate-600 tracking-wider sticky top-0 z-20">
              {/* 第一层表头：大分组 */}
              <tr className="bg-slate-100 text-slate-900">
                <th colSpan={1} className="px-4 py-2 text-center bg-slate-200 text-slate-900 border-b border-r border-slate-300 sticky left-0 z-30">Actions</th>
                <th colSpan={6} className="px-4 py-2 text-center bg-indigo-50 text-indigo-900 border-b border-r border-slate-200">Opportunity Info</th>
                <th colSpan={1} className="px-4 py-2 text-center bg-slate-50 border-b border-r border-slate-200">Tender Category</th>
                <th colSpan={5} className="px-4 py-2 text-center bg-amber-50 text-amber-900 border-b border-r border-slate-200">Current Contract</th>
                <th colSpan={1} className="px-4 py-2 text-center bg-sky-50 text-sky-900 border-b border-r border-slate-200">Tender Planning</th>
                <th colSpan={4} className="px-4 py-2 text-center bg-slate-50 border-b border-r border-slate-200">Submission</th>
                <th colSpan={5} className="px-4 py-2 text-center bg-emerald-50 text-emerald-950 border-b border-slate-200">Result Outcomes</th>
              </tr>
              {/* 第二层表头：具体字段 */}
              <tr className="bg-slate-50 text-slate-700 text-[11px] uppercase">
                <th className="px-4 py-3 font-semibold text-center min-w-[90px] border-b border-r border-slate-300 sticky left-0 z-30 bg-slate-50">Action</th>
                <th className="px-4 py-3 font-semibold min-w-[180px] border-b border-slate-200">Tender No.</th>
                <th className="px-4 py-3 font-semibold min-w-[220px] border-b border-slate-200">End User</th>
                <th className="px-4 py-3 font-semibold min-w-[120px] border-b border-slate-200">State</th>
                <th className="px-4 py-3 font-semibold min-w-[120px] border-b border-slate-200">Area</th>
                <th className="px-4 py-3 font-semibold min-w-[100px] border-b border-slate-200">Marketing</th>
                <th className="px-4 py-3 font-semibold min-w-[100px] border-b border-r border-slate-300">Sales</th>
                <th className="px-4 py-3 font-semibold min-w-[120px] border-b border-r border-slate-300">Category</th>
                <th className="px-4 py-3 font-semibold min-w-[150px] border-b border-slate-200">Existing Vendor</th>
                <th className="px-4 py-3 font-semibold min-w-[110px] border-b border-slate-200">Existing Brand</th>
                <th className="px-4 py-3 font-semibold min-w-[90px] border-b border-slate-200">Existing Qty</th>
                <th className="px-4 py-3 font-semibold min-w-[90px] border-b border-slate-200">Duration</th>
                <th className="px-4 py-3 font-semibold min-w-[120px] border-b border-r border-slate-300">End Date</th>
                <th className="px-4 py-3 font-semibold min-w-[120px] border-b border-r border-slate-300">Expected Open</th>
                <th className="px-4 py-3 font-semibold min-w-[120px] border-b border-slate-200">Open Date</th>
                <th className="px-4 py-3 font-semibold min-w-[240px] border-b border-slate-200">Specs Requirement</th>
                <th className="px-4 py-3 font-semibold min-w-[120px] border-b border-slate-200">Budget</th>
                <th className="px-4 py-3 font-semibold min-w-[120px] border-b border-r border-slate-300">Proposed Brand</th>
                <th className="px-4 py-3 font-semibold min-w-[100px] border-b border-slate-200">Status</th>
                <th className="px-4 py-3 font-semibold min-w-[160px] border-b border-slate-200">Awarded Vendor</th>
                <th className="px-4 py-3 font-semibold min-w-[120px] border-b border-slate-200">Awarded Brand</th>
                <th className="px-4 py-3 font-semibold min-w-[135px] border-b border-slate-200">Awarded Amt</th>
                <th className="px-4 py-3 font-semibold min-w-[110px] border-b bg-emerald-50 text-emerald-900">Variance</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan={23} className="px-4 py-12 text-center text-slate-400 border-b border-slate-200">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                      <span>Loading records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={23} className="px-4 py-12 text-center text-slate-400 border-b border-slate-200">
                    No records found matching the specified query filters.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr key={item.tenderNo + index} className="hover:bg-slate-50/80 transition duration-150 group">
                    <td className="px-4 py-3 text-center border-b border-r border-slate-300 sticky left-0 bg-white group-hover:bg-slate-50 transition z-10">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          onClick={() => openEditModal(item)}
                          className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition"
                          title="Edit Tender Row"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.tenderNo)}
                          className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded transition"
                          title="Delete Row"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 break-all border-b border-slate-200">{item.tenderNo}</td>
                    <td className="px-4 py-3 min-w-[220px] whitespace-normal break-words border-b border-slate-200" title={item.endUser || ''}>{item.endUser || '-'}</td>
                    <td className="px-4 py-3 border-b border-slate-200">{item.state || '-'}</td>
                    <td className="px-4 py-3 border-b border-slate-200">{item.area || '-'}</td>
                    <td className="px-4 py-3 border-b border-slate-200"><span className="px-2 py-0.5 rounded-full bg-slate-100 font-medium">{item.marketing || '-'}</span></td>
                    <td className="px-4 py-3 border-b border-r border-slate-300">{item.sales || '-'}</td>
                    <td className="px-4 py-3 border-b border-r border-slate-300 font-medium text-indigo-700">{item.tenderCategory || '-'}</td>
                    <td className="px-4 py-3 min-w-[150px] whitespace-normal break-words border-b border-slate-200">{item.existingVendor || '-'}</td>
                    <td className="px-4 py-3 border-b border-slate-200">{item.existingBrand || '-'}</td>
                    <td className="px-4 py-3 border-b border-slate-200">{item.existingQuantity ?? '-'}</td>
                    <td className="px-4 py-3 border-b border-slate-200">{item.contractDuration ? `${item.contractDuration} Mths` : '-'}</td>
                    <td className="px-4 py-3 border-b border-r border-slate-300">{formatDate(item.contractEndDate)}</td>
                    <td className="px-4 py-3 border-b border-r border-slate-300">{formatDate(item.expectedTenderOpenDate)}</td>
                    <td className="px-4 py-3 border-b border-slate-200">{formatDate(item.tenderOpenDate)}</td>
                    <td className="px-4 py-3 border-b border-slate-200 whitespace-pre-line text-slate-600 text-[11px] leading-relaxed max-w-[240px] font-mono">{item.specsRequirement || '-'}</td>
                    <td className="px-4 py-3 border-b border-slate-200 font-semibold">{formatCurrency(item.budget)}</td>
                    <td className="px-4 py-3 border-b border-r border-slate-300">{item.proposedBrand || '-'}</td>
                    <td className="px-4 py-3 border-b border-slate-200">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        item.resultStatus === 'Win' ? 'bg-emerald-100 text-emerald-800' :
                        item.resultStatus === 'Lose' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.resultStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[150px] truncate border-b border-slate-200">{item.awardedVendor || '-'}</td>
                    <td className="px-4 py-3 border-b border-slate-200">{item.awardedBrand || '-'}</td>
                    <td className="px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">{formatCurrency(item.awardedAmount)}</td>
                    <td className={`px-4 py-3 font-bold border-b bg-emerald-50/30 ${
                      item.awardedVariance?.startsWith('-') ? 'text-rose-600' : item.awardedVariance ? 'text-emerald-600' : 'text-slate-400'
                    }`}>
                      {item.awardedVariance || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 模态弹窗：全字段表单 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">{modalMode === 'edit' ? 'Edit Tender Record' : 'Add New Tender Opportunity'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-500"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleFormSubmit}>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 max-h-[520px] overflow-y-auto">
                <div className="sm:col-span-3 border-b border-slate-100 pb-1">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">1. Opportunity Details</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tender No. *</label>
                  <input required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-slate-50 disabled:opacity-70" value={formRecord.tenderNo} onChange={e => setFormRecord({...formRecord, tenderNo: e.target.value})} placeholder="QT25000000" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End User</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.endUser || ''} onChange={e => setFormRecord({...formRecord, endUser: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.state || ''} onChange={e => setFormRecord({...formRecord, state: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Area</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.area || ''} onChange={e => setFormRecord({...formRecord, area: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Marketing Person</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.marketing || ''} onChange={e => setFormRecord({...formRecord, marketing: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sales Person</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.sales || ''} onChange={e => setFormRecord({...formRecord, sales: e.target.value})} />
                </div>

                <div className="sm:col-span-3 border-b border-slate-100 pt-2 pb-1">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">2. Category & Current Contract</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tender Category</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.tenderCategory || ''} onChange={e => setFormRecord({...formRecord, tenderCategory: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Existing Vendor</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.existingVendor || ''} onChange={e => setFormRecord({...formRecord, existingVendor: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Existing Brand</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.existingBrand || ''} onChange={e => setFormRecord({...formRecord, existingBrand: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Existing Qty</label>
                  <input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.existingQuantity ?? ''} onChange={e => setFormRecord({...formRecord, existingQuantity: e.target.value ? parseInt(e.target.value) : null})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contract Duration (Mths)</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.contractDuration || ''} onChange={e => setFormRecord({...formRecord, contractDuration: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contract End Date</label>
                  <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.contractEndDate || ''} onChange={e => setFormRecord({...formRecord, contractEndDate: e.target.value})} />
                </div>

                <div className="sm:col-span-3 border-b border-slate-100 pt-2 pb-1">
                  <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">3. Planning & Requirements</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expected Open Date</label>
                  <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.expectedTenderOpenDate || ''} onChange={e => setFormRecord({...formRecord, expectedTenderOpenDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Actual Open Date</label>
                  <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.tenderOpenDate || ''} onChange={e => setFormRecord({...formRecord, tenderOpenDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Budget (RM)</label>
                  <input type="number" step="0.01" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.budget || ''} onChange={e => setFormRecord({...formRecord, budget: e.target.value ? parseFloat(e.target.value) : null})} />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Specs Requirement</label>
                  <textarea rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.specsRequirement || ''} onChange={e => setFormRecord({...formRecord, specsRequirement: e.target.value})} />
                </div>

                <div className="sm:col-span-3 border-b border-slate-100 pt-2 pb-1">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">4. Result Details</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Proposed Brand</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.proposedBrand || ''} onChange={e => setFormRecord({...formRecord, proposedBrand: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Result Status</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.resultStatus || 'Pending'} onChange={e => setFormRecord({...formRecord, resultStatus: e.target.value})}>
                    <option value="Pending">Pending</option>
                    <option value="Win">Win</option>
                    <option value="Lose">Lose</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Awarded Vendor</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.awardedVendor || ''} onChange={e => setFormRecord({...formRecord, awardedVendor: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Awarded Brand</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.awardedBrand || ''} onChange={e => setFormRecord({...formRecord, awardedBrand: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Awarded Amount (RM)</label>
                  <input type="number" step="0.01" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={formRecord.awardedAmount || ''} onChange={e => setFormRecord({...formRecord, awardedAmount: e.target.value ? parseFloat(e.target.value) : null})} />
                </div>
              </div>
              
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}