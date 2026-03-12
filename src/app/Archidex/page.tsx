"use client"
import { useEffect, useState, useRef } from "react";
import { Search, Database, ChevronDown, ChevronUp, Package, MessageSquare, Plus, X, Edit3, Trash2, Upload } from "lucide-react";
import React from "react";

interface Archidex {
    id: number;
    title?: string;
    accountManager?: string;
    name?: string;
    mobile?: string;
    email?: string;
    companyName?: string;
    job?: string;
    profession?: string;
    country?: string;
    state?: string;
    product?: string;
    status?: string;
    remarks?: string;
}
const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Archidex`;

const ArchidexPage = () => {
    const [data, setData] = useState<Archidex[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // New state to track mode
    const [filterCategory, setFilterCategory] = useState("all"); // Default to "all" or a specific field
    const initialFormState = {
        id: 0, title: "", accountManager: "", name: "", mobile: "",
        email: "", companyName: "", job: "", profession: "",
        country: "", state: "", product: "", status: "Unqualified", remarks: ""
    };

    const [formData, setFormData] = useState(initialFormState);
    const [expandedIds, setExpandedIds] = useState<number[]>([]);

    const fetchData = async () => {
        try {
            const res = await fetch(API_URL);
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error("Failed to fetch Archidex data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleRow = (id: number) => {
        setExpandedIds(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id) // collapse if already open
                : [...prev, id]                     // expand if not open
        );
    };

    // OPEN MODAL FOR NEW RECORD
    const handleAddNew = () => {
        setFormData(initialFormState);
        setIsEditing(false);
        setIsModalOpen(true);
    };

    // OPEN MODAL FOR EDITING
    const handleEdit = (e: React.MouseEvent, item: Archidex) => {
        e.stopPropagation(); // Prevent row from expanding when clicking edit
        setFormData({
            id: item.id,
            title: item.title || "",
            accountManager: item.accountManager || "",
            name: item.name || "",
            mobile: item.mobile || "",
            email: item.email || "",
            companyName: item.companyName || "",
            job: item.job || "",
            profession: item.profession || "",
            country: item.country || "",
            state: item.state || "",
            product: item.product || "",
            status: item.status || "",
            remarks: item.remarks || ""
        });
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = isEditing
            ? `${API_URL}/${formData.id}`
            : API_URL;

        const method = isEditing ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchData(); // Refresh list without full page reload
            }
        } catch (err) {
            console.error("Operation failed:", err);
        }
    };

    const filteredData = data.filter(item => {
        const search = searchTerm.toLowerCase().trim();

        if (!search) return true; // no search term, show all

        // If user selects a specific category
        if (filterCategory !== "all") {
            const value = item[filterCategory as keyof Archidex]?.toString().toLowerCase();

            // Special logic for PIC (accountManager) and State to support multiple values
            if (filterCategory === "accountManager" || filterCategory === "state") {
                const values = search.split(",").map(v => v.trim()); // split by comma and trim spaces
                return values.some(v => value?.includes(v));
            }

            return value?.includes(search);
        }

        // Default "All" search (Search across multiple main fields)
        return (
            item.name?.toLowerCase().includes(search) ||
            item.companyName?.toLowerCase().includes(search) ||
            item.email?.toLowerCase().includes(search) ||
            item.profession?.toLowerCase().includes(search)
        );
    });

    const handleDelete = async (id: number) => {
        // Basic browser confirmation for safety
        if (!window.confirm("Are you sure you want to delete this record? This action cannot be undone.")) {
            return;
        }

        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                // Refresh the list by filtering out the deleted item from state
                setData(prevData => prevData.filter(item => item.id !== id));
            } else {
                alert("Failed to delete the record.");
            }
        } catch (err) {
            console.error("Delete operation failed:", err);
        }
    };

    const handleExportExcel = async () => {
        const baseUrl = `${API_URL}/export`;
        const params = new URLSearchParams();

        if (searchTerm) {
            params.append("category", filterCategory);
            params.append("query", searchTerm);
        }

        const finalUrl = searchTerm ? `${baseUrl}?${params}` : baseUrl;

        const res = await fetch(finalUrl);
        const blob = await res.blob();

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "ArchidexExport.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();

        window.URL.revokeObjectURL(url);
    };
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const handleImportExcel = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`${API_URL}/import-excel`, {
                method: "POST",
                body: formData
            });

            if (!res.ok) {
                const msg = await res.text();
                alert(`Import failed: ${msg}`);
                return;
            }

            alert("Excel imported successfully!");
            fetchData(); // refresh table
        } catch (err) {
            console.error("Excel import failed:", err);
            alert("Something went wrong while importing.");
        }
    };
    const triggerExcelUpload = () => {
        fileInputRef.current?.click();
    };


    return (
        <div className="min-h-screen bg-[#fcfdfe] p-4 md:p-10 font-sans selection:bg-red-100 selection:text-red-700">
            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImportExcel(file);
                }}
            />

            <div className="max-w-[1500px] mx-auto space-y-8">
                {/* --- PREMIUM HEADER --- */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 sticky top-4 z-30">
                    <div className="flex items-center gap-5">
                        <div className="bg-gradient-to-br from-red-500 to-rose-600 p-3.5 rounded-2xl text-white shadow-lg shadow-red-200">
                            <Database size={26} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tightest">
                                ARCHIDEX <span className="text-red-500 font-medium">DB</span>
                            </h1>
                            <p className="text-slate-400 text-[13px] font-medium tracking-wide">Premium Lead Management Interface</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={triggerExcelUpload}
                            className="group flex items-center gap-2.5 px-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-[12px] font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/50 transition-all active:scale-95 shadow-sm"
                        >
                            <Upload size={16} className="group-hover:-translate-y-0.5 transition-transform" />
                            IMPORT ASSETS
                        </button>

                        <button
                            onClick={handleAddNew}
                            className="flex items-center gap-2.5 px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-[12px] font-bold tracking-wider hover:bg-red-500 transition-all active:scale-95 shadow-xl shadow-slate-200 hover:shadow-red-200"
                        >
                            <Plus size={20} /> ADD NEW RECORD
                        </button>
                    </div>
                </header>

                {/* --- ACTION BAR (Search & Export) --- */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center bg-white border border-slate-100 rounded-[1.5rem] p-1.5 shadow-sm focus-within:ring-4 focus-within:ring-slate-100 transition-all duration-500 w-full md:w-fit">
                        <div className="relative flex items-center px-2">
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="pl-4 pr-10 py-2.5 bg-slate-50 border-none rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-500 outline-none cursor-pointer appearance-none hover:bg-slate-100 transition-colors"
                            >
                                <option value="companyName">Company</option>
                                <option value="name">Name</option>
                                <option value="accountManager">PIC</option>
                                <option value="state">State</option>
                                <option value="product">Product</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-5 text-slate-400 pointer-events-none" />
                        </div>

                        <div className="h-8 w-[1px] bg-slate-100 mx-2" />

                        <div className="relative flex items-center flex-1 md:w-80 group">
                            <Search className={`absolute left-4 transition-colors duration-300 ${searchTerm ? 'text-red-500' : 'text-slate-300 group-focus-within:text-red-500'}`} size={18} />
                            <input
                                type="text"
                                value={searchTerm}
                                placeholder={`Search ${filterCategory}...`}
                                className="pl-12 pr-4 py-3 bg-transparent border-none text-[15px] font-medium outline-none w-full text-slate-700 placeholder:text-slate-300"
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-3 px-6 py-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl text-[12px] font-black tracking-widest hover:bg-emerald-600 hover:text-white transition-all active:scale-95 group shadow-sm"
                    >
                        <div className="w-2 h-2 rounded-full bg-emerald-500 group-hover:bg-white animate-pulse" />
                        GENERATE EXCEL REPORT
                    </button>
                </div>

                {/* --- DATA TABLE --- */}
                <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50/30">
                                    <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer Identity</th>
                                    <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Corporate Details</th>
                                    <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Regional Origin</th>
                                    <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">PIC</th>
                                    <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Lifecycle</th>
                                    <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredData.map((item, index) => (
                                    <React.Fragment key={item.id}>
                                        <tr
                                            onClick={() => toggleRow(item.id)}
                                            className={`group cursor-pointer transition-all duration-300 ${expandedIds.includes(item.id) ? 'bg-slate-50/80 shadow-inner' : 'hover:bg-slate-50/50'}`}
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-11 h-11 rounded-2xl flex items-center text-sm font-bold justify-center transition-all ${expandedIds.includes(item.id) ? 'bg-slate-900 text-white rotate-12' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:shadow-md'}`}>
                                                        {String(index + 1).padStart(2, '0')}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-800 text-[15px] tracking-tight">{item.title} {item.name}</div>
                                                        <div className="text-[12px] text-slate-400 font-medium">{item.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-700 text-sm">{item.companyName}</div>
                                                <div className="text-[11px] text-slate-400">{item.job}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-700 text-sm">{item.country}</div>
                                                <div className="text-[11px] text-slate-400">{item.state}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-xs font-semibold px-3 py-1 bg-slate-100 rounded-lg">{item.accountManager || "N/A"}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${item.status === 'Won' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={(e) => handleEdit(e, item)}
                                                        className="p-2 hover:bg-yellow-100 text-slate-400 hover:text-yellow-600 rounded-lg transition-colors"
                                                        title="Edit Record"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevents row from expanding
                                                            handleDelete(item.id);
                                                        }}
                                                        className="p-2 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                                                        title="Delete Record"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    {expandedIds.includes(item.id) ? <ChevronUp size={18} className="text-red-600" /> : <ChevronDown size={18} className="text-slate-300" />}
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedIds.includes(item.id) && (
                                            <tr>
                                                <td colSpan={6} className="px-10 py-10 bg-gradient-to-b from-slate-50/50 to-white border-x-8 border-slate-900">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                                        <div className="flex gap-6">
                                                            <div className="bg-white p-4 rounded-2xl shadow-sm h-fit border border-slate-100"><Package className="text-red-500" size={24} /></div>
                                                            <div>
                                                                <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Interests & Products</h5>
                                                                <p className="text-sm text-slate-700 leading-relaxed font-medium">{item.product || "No specific products listed."}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-6">
                                                            <div className="bg-white p-4 rounded-2xl shadow-sm h-fit border border-slate-100"><MessageSquare className="text-blue-500" size={24} /></div>
                                                            <div>
                                                                <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Strategic Remarks</h5>
                                                                <p className="text-sm text-slate-600 italic leading-relaxed font-medium bg-white p-4 rounded-xl border border-dashed border-slate-200">
                                                                    &quot;{item.remarks || "No additional staff notes provided."}&quot;
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL (Unified Add/Edit) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-black text-slate-800">Create New Record</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Title</label>
                                    <select name="title" value={formData.title} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                                        <option value="AR">AR</option>
                                        <option value="AR.">AR.</option>
                                        <option value="IDR">IDR</option>
                                        <option value="IR">IR</option>
                                        <option value="MR">MR</option>
                                        <option value="MRS">MRS</option>
                                        <option value="MS">MS</option>
                                        <option value="MS.">MS.</option>
                                        <option value="OTHER">OTHER</option>
                                        <option value="SR">SR</option>
                                        <option value="TAN SRI">TAN SRI</option>
                                        <option value="TS">TS</option>
                                        <option value="">--BLANK--</option>

                                    </select>
                                </div>
                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Full Name</label>
                                    <input name="name" required value={formData.name} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Email Address</label>
                                    <input name="email" type="email" value={formData.email} required onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="xxxxx@company.com" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Mobile</label>
                                    <input name="mobile" type="mobile" value={formData.mobile} required onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="xxx-xxxxxxx" />
                                </div>

                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Company Name</label>
                                    <input name="companyName" value={formData.companyName} required onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Account Manager</label>
                                    <input name="accountManager" value={formData.accountManager} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Status</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                                        <option value="Unqualified">Unqualified</option>
                                        <option value="Potential">Potential</option>
                                        <option value="Hot / Ready to Close">Hot / Ready to Close</option>
                                        <option value="Won">Won</option>
                                        <option value="Lost">Lost</option>
                                        <option value="">--Blank--</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Job</label>
                                    <input name="job" value={formData.job} type="job" required onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Profession</label>
                                    <input name="profession" value={formData.profession} type="profession" required onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="" />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Country</label>
                                    <input name="country" value={formData.country} required onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">State</label>
                                    <input name="state" value={formData.state} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                                </div>
                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Product</label>
                                    <textarea name="product" value={formData.product} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                                </div>

                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Remarks</label>
                                    <textarea name="remarks" value={formData.remarks} rows={3} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-red-400 text-white rounded-xl font-bold shadow-lg shadow-red-100 hover:bg-red-500 transition-all">Submit Record</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArchidexPage;