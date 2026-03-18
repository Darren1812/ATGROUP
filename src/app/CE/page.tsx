"use client";

import React, { useState, useEffect, ChangeEvent, useRef, useCallback } from "react";
import {
    Plus,
    X,
    Edit,
    Trash2,
    Calendar,
    DollarSign,
    FileText,
    User,
    Hash,
    Briefcase,
    FileDown,
    ChevronDown,
    SlidersHorizontal,
    FileSpreadsheet,
    Upload,
    Eye,
    ChevronRight,
    Files,
    FileArchive,
    Package,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useToast } from "@/components/ToastProvider"; // Make sure ToastProvider is wrapped in layout

interface Contract {
    id?: number; // added for backend sync
    serviceName: string;
    contractValue: string;
    contactOfficer: string;
    contractNumber: string;
    contractDuration: string;
    startDate: string;
    endDate: string;
    agencyName: string;
    company: string;
    progress: string;
    pdfDocument: null;
}

// --- InputField component (for single-line inputs) ---
const InputField: React.FC<{
    name: keyof Contract;
    placeholder: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onBlur?: () => void;
    colSpan?: string;
    icon?: React.ReactNode;
    label: string;
    helperText?: string;
    type?: string;
}> = ({
    name,
    placeholder,
    value,
    onChange,
    onBlur,
    colSpan = "col-span-1",
    icon,
    label,
    helperText,
    type = "text",
}) => (
        <div className={`${colSpan} flex flex-col space-y-1`}>
            <label htmlFor={name} className="text-sm font-semibold text-gray-700">
                {label}
            </label>
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                        {icon}
                    </div>
                )}
                <input
                    id={name}
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    className={`w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition duration-150 ease-in-out ${icon ? "pl-10" : ""
                        }`}
                />
            </div>
            {helperText && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
        </div>
    );

// --- Progress bar ---
const ProgressBar: React.FC<{ progress: string | number }> = ({ progress }) => {
    // Convert to number safely
    const numericProgress = Math.min(
        Math.max(
            typeof progress === "number"
                ? progress
                : parseFloat((progress || "0").toString().replace("%", "")),
            0
        ),
        100
    );

    // Determine bar color and text color
    let barColor = "bg-indigo-500";
    let textColor = "text-indigo-700";
    if (numericProgress >= 100) {
        barColor = "bg-green-500";
        textColor = "text-green-700";
    } else if (numericProgress < 50) {
        barColor = "bg-yellow-400";
        textColor = "text-yellow-700";
    }

    return (
        <div className="w-full bg-gray-200 rounded-full h-4">
            <div
                className={`${barColor} h-4 rounded-full transition-all duration-300`}
                style={{ width: `${numericProgress}%` }}
            />
            <p className={`text-xs mt-1 text-right ${textColor}`}>
                {numericProgress.toFixed(0)}%
            </p>
        </div>
    );
};


// --- Main Component ---
export default function Page() {
    const addToast = useToast();

    const [contracts, setContracts] = useState<Contract[]>([]);
    const [formData, setFormData] = useState<Contract>({
        serviceName: "",
        contractValue: "",
        contactOfficer: "",
        contractNumber: "",
        contractDuration: "",
        startDate: "",
        endDate: "",
        agencyName: "",
        company: "",
        progress: "0%",
        pdfDocument: null
    });
    const [showForm, setShowForm] = useState(false);
    const [editIndex, setEditIndex] = useState<number | null>(null);

    const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Contracts`;

    // Fetch all contracts on load

    const calculateProgress = useCallback((startDate: string, endDate: string) => {
        if (!startDate || !endDate) return "0%";

        const parseDate = (dateStr: string): Date | null => {
            if (dateStr.includes("/")) {
                // Parse dd/mm/yyyy
                const [d, m, y] = dateStr.split("/").map(Number);
                if (d && m && y) {
                    return new Date(y, m - 1, d);
                }
            } else if (dateStr.includes("-")) {
                // Parse ISO format (YYYY-MM-DD or YYYY-MM-DDT...)
                return new Date(dateStr);
            }
            return new Date(NaN);
        };

        const start = parseDate(startDate) as Date;
        const end = parseDate(endDate) as Date;

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            console.error("Invalid date parsing for progress calculation:", startDate, endDate);
            return "0%";
        }

        const today = new Date();

        // Normalize dates to start of day
        today.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        // Include final day
        const finalEnd = new Date(end.getTime());
        finalEnd.setDate(finalEnd.getDate() + 1);

        if (today < start) return "0%";

        const total = finalEnd.getTime() - start.getTime();
        if (today >= finalEnd) return "100%";

        const elapsed = today.getTime() - start.getTime();
        if (total <= 0) return "100%";

        return `${Math.round((elapsed / total) * 100)}%`;
    }, []);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const PAGE_SIZE = 50;

    const fetchContracts = useCallback(
        async (pageToLoad = 0) => {
            try {
                const res = await fetch(
                    `${API_URL}?page=${pageToLoad}&pageSize=${PAGE_SIZE}`
                );
                const data = await res.json();

                // if less than page size, no more data
                if (data.length < PAGE_SIZE) {
                    setHasMore(false);
                }

                const contractsWithProgress = data.map((contract: Contract) => ({
                    ...contract,
                    progress: calculateProgress(contract.startDate, contract.endDate),
                }));

                setContracts((prev) =>
                    pageToLoad === 0
                        ? contractsWithProgress
                        : [...prev, ...contractsWithProgress]
                );
            } catch (error) {
                console.error("Failed to fetch:", error);
            } finally {
                setLoading(false); // 🔴 Stop loading regardless of success or error
            }
        },
        [API_URL, calculateProgress]
    );
    useEffect(() => {
        fetchContracts(0);
    }, [fetchContracts]);

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };


    const handleContractValueBlur = () => {
        if (!formData.contractValue) return;
        const rawValue = formData.contractValue.replace(/[RM,\s]/g, "");
        const amount = parseFloat(rawValue);
        if (isNaN(amount)) return;
        const formatted = amount.toLocaleString("en-MY", {
            style: "currency",
            currency: "MYR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        setFormData({
            ...formData,
            contractValue: formatted.replace("MYR", "RM").trim(),
        });
    };
    const calculateDuration = (startDate: string, endDate: string) => {
        const [sd, sm, sy] = startDate.split("/").map(Number);
        const [ed, em, ey] = endDate.split("/").map(Number);
        if (!sd || !sm || !sy || !ed || !em || !ey) return "0";

        const start = new Date(sy, sm - 1, sd);
        const end = new Date(ey, em - 1, ed);

        // Calculate complete months between dates (Excel DATEDIF with "m" parameter)
        let months = (end.getFullYear() - start.getFullYear()) * 12 +
            (end.getMonth() - start.getMonth());

        // Adjust if end day is less than start day (Excel DATEDIF behavior)
        if (end.getDate() < start.getDate()) {
            months--;
        }

        // Add 1 (to match your Excel formula)
        return Math.max(months + 1, 0).toString();
    };
    const handleSave = async () => {
        // 1. 验证日期是否存在
        if (!formData.startDate || !formData.endDate) {
            alert("Please select both Start Date and End Date.");
            return;
        }

        // 辅助函数：将 dd/mm/yyyy 转换为 yyyy-mm-dd
        const formatToStandardDate = (dateStr: string) => {
            if (dateStr.includes('/')) {
                const [day, month, year] = dateStr.split('/');
                // 确保格式是 yyyy-mm-dd
                return `${year}-${month}-${day}`;
            }
            return dateStr; // 如果已经是标准格式则直接返回
        };

        try {
            const stdStartDate = formatToStandardDate(formData.startDate);
            const stdEndDate = formatToStandardDate(formData.endDate);

            // 验证转换后的日期是否合法
            const startD = new Date(stdStartDate);
            const endD = new Date(stdEndDate);

            if (isNaN(startD.getTime()) || isNaN(endD.getTime())) {
                throw new Error("Date format is invalid. Please use dd/mm/yyyy.");
            }

            const duration = calculateDuration(formData.startDate, formData.endDate);

            // 2. 构造 Payload
            const payload = {
                Id: formData.id || 0,
                ServiceName: formData.serviceName,
                ContractValue: formData.contractValue,
                ContactOfficer: formData.contactOfficer,
                ContractNumber: formData.contractNumber,
                ContractDuration: duration,
                // 此时调用 toISOString 就安全了
                StartDate: startD.toISOString(),
                EndDate: endD.toISOString(),
                AgencyName: formData.agencyName,
                Company: `${baseCompany}${jurisdiction}`, // 拼接公司和管辖权
                PdfDocument: null
            };

            // 3. 发送请求
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Backend Error:", errorData);
                throw new Error("Server rejected the data.");
            }

            alert("Saved successfully!");
            setShowForm(false);
            // ... 重置表单逻辑

        } catch (err: any) {
            console.error("Save failed:", err);
            alert(`保存失败: ${err.message || err}`);
        }
    };    // ✅ Edit contract
    const handleEdit = (index: number) => {
        setFormData(contracts[index]);
        setEditIndex(index);
        setShowForm(true);
    };

    // ✅ Delete contract
    const handleDelete = async (index: number) => {
        const item = contracts[index];
        if (!item.id) return;
        if (confirm("Are you sure you want to delete this record?")) {
            await fetch(`${API_URL}/${item.id}`, { method: "DELETE" });
            await fetchContracts();
        }
    };

    const renderTableHeader = (label: string, className?: string) => (
        <th
            className={`px-4 py-3 text-left font-bold text-gray-600 uppercase tracking-wider text-xs align-top ${className}`}
        >
            {label}
        </th>
    );

    const renderTableCell = (content: React.ReactNode, className?: string) => (
        <td className={`px-4 py-3 text-sm text-gray-800 align-top ${className}`}>
            {content}
        </td>
    );
    const [selectedCompany, setSelectedCompany] = useState<string>("");
    const [selectedAgency, setSelectedAgency] = useState<string>("");

    const handleCompanyFilterChange = useCallback(
        async (eOrValue: ChangeEvent<HTMLSelectElement> | string) => {
            const company =
                typeof eOrValue === "string" ? eOrValue : eOrValue.target.value;

            setSelectedCompany(company);

            const agency = selectedAgency || "";

            try {
                const query = new URLSearchParams();
                query.append("company", company);
                if (agency) query.append("agency", agency);

                const res = await fetch(`${API_URL}/filter?${query.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    const filtered = data.map((contract: Contract) => ({
                        ...contract,
                        progress: calculateProgress(contract.startDate, contract.endDate),
                    }));
                    setContracts(filtered);
                } else {
                    setContracts([]);
                }
            } catch (err) {
                console.error("Failed to filter contracts:", err);
                addToast("Error fetching filtered contracts. Check console for details.");
            }
        },
        [selectedAgency, API_URL, calculateProgress, addToast]
    );


    const handleExportExcel = async () => {
        try {
            // Use the same filters that are currently active
            const query = new URLSearchParams();

            if (selectedCompany && selectedCompany.toLowerCase() !== "all")
                query.append("company", selectedCompany);

            if (selectedAgency && selectedAgency.toLowerCase() !== "all")
                query.append("agency", selectedAgency);

            // Make the API call
            const res = await fetch(`${API_URL}/export-excel?${query.toString()}`, {
                method: "GET",
            });

            if (!res.ok) {
                addToast("❌ Failed to export Excel.", "error");
                return;
            }

            // Convert response to a Blob
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);

            // Create a temporary <a> element for download
            const a = document.createElement("a");
            a.href = url;
            a.download = "ContractsExport.xlsx";
            document.body.appendChild(a);
            a.click();

            // Clean up
            a.remove();
            window.URL.revokeObjectURL(url);
            addToast("✅ Excel exported successfully!", "success");

        } catch (err) {
            console.error("Error exporting Excel:", err);
            addToast("⚠️ Error exporting Excel. Check console.", "error");
        }
    };

    const handleExport = async (company: string) => {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const endpointPath = `/api/Contracts/export-pdf?company=${encodeURIComponent(company)}`;
        const apiUrl = `${apiBaseUrl}${endpointPath}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/pdf',
                },
            });

            // 2. Handle Errors (e.g., 404 Not Found from your API)
            if (response.status === 404) {
                const errorData = await response.json();
                addToast(`Export failed: ${errorData.message}`);
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // 3. Extract the Filename
            let filename = `contracts_export_${new Date().toISOString().slice(0, 10)}.pdf`;
            const contentDisposition = response.headers.get('Content-Disposition');
            if (contentDisposition) {
                const match = contentDisposition.match(/filename\*?=['"]?(.*)['"]?$/i);
                if (match && match[1]) {
                    filename = decodeURIComponent(match[1]);
                }
            }

            // 4. Create a Download Link and Trigger Download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;

            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            addToast("✅ Data exported successfully!", "success");

            console.log(`Successfully downloaded ${filename}`);

        } catch (error) {
            console.error("Error during PDF export:", error);
            addToast("An unexpected error occurred while trying to download the file. Check your API URL and network connection.");
        }
    };
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    // Assuming you already have 'companies' array available from somewhere, 
    // but for this example, we'll list them out.

    // Helper function to close the dropdown when clicking outside
    const dropdownRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowExportDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    const [selectedDocumentRow, setSelectedDocumentRow] = useState<number | null>(null);
    const handlePreview = (serviceName: string) => {
        const url = `${API_URL}/preview-pdf?serviceName=${encodeURIComponent(serviceName)}`;
        window.open(url, "_blank");
    };


    const handleUpload = async (serviceName: string) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/pdf";

        input.onchange = async (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            if (!file) return;

            const formData = new FormData();
            formData.append("file", file);

            try {
                // 🔹 Use query param instead of path param
                const res = await fetch(
                    `${API_URL}/upload-pdf?serviceName=${encodeURIComponent(serviceName)}`,
                    {
                        method: "POST",
                        body: formData,
                    }
                );

                if (res.ok) {
                    addToast(`✅ PDF uploaded successfully for "${serviceName}"`);
                } else {
                    const msg = await res.text();
                    addToast(`❌ Upload failed: ${msg}`);
                }
            } catch (err) {
                console.error("Upload error:", err);
                addToast("Error uploading file. Check console for details.");
            }
        };

        input.click();
    };

    const handleExportDocuments = async (company: string) => {
        try {
            if (!company) {
                addToast("⚠️ Please select a company first.");
                return;
            }

            const queryParams = new URLSearchParams();
            queryParams.append("company", company);

            const res = await fetch(`${API_URL}/merge-pdfs?${queryParams.toString()}`, {
                method: "GET",
            });

            if (!res.ok) {
                const msg = await res.text();
                addToast(`❌ Failed to export documents: ${msg}`);
                return;
            }

            // ✅ Convert response to blob (PDF)
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);

            // ✅ Automatically download the merged PDF
            const a = document.createElement("a");
            a.href = url;
            a.download = `${company}_MergedContracts.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();

            // Optional: revoke the URL after download
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
            addToast("✅ Document exported successfully!", "success");

        } catch (err) {
            console.error("Error exporting documents:", err);
            addToast("⚠️ Error exporting documents. Check console for details.");
        }
    };
    const handleExportSst = async (company: string) => {
        try {
            const res = await fetch(`${API_URL}/final-sst-pdf?company=${company}`);
            if (!res.ok) {
                const msg = await res.text();
                addToast(`❌ Failed to generate SST PDF: ${msg}`);
                return;
            }

            // Convert to blob and trigger download
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${company}_SST_Final.pdf`;
            a.click();
            a.remove();
            addToast("✅ SST exported successfully!", "success");

        } catch (err) {
            console.error("Error exporting SST PDF:", err);
            addToast("⚠️ Error exporting SST PDF. Check console for details.");
        }
    };

    const [baseCompany, setBaseCompany] = useState('');
    const [jurisdiction, setJurisdiction] = useState('');

    const handleBaseCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setBaseCompany(e.target.value);
    };

    const handleJurisdictionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setJurisdiction(e.target.value);
    };

    const handleClearJurisdiction = () => {
        setJurisdiction('');
    };

    // *** THIS auto fires API whenever base / jurisdiction changes ***
    useEffect(() => {
        const finalCompany = baseCompany + jurisdiction;
        handleCompanyFilterChange(finalCompany);
    }, [baseCompany, jurisdiction, handleCompanyFilterChange]);
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            company: baseCompany + jurisdiction, // "ASN", "ASN(state)", etc.
        }));
    }, [baseCompany, jurisdiction]);
    const [loading, setLoading] = useState<boolean>(false);
    return (
        <ProtectedRoute>
            <main className="p-4 md:p-8 bg-gray-100 min-h-screen">
                <div className="flex flex-col h-screen">
                    <header className="flex justify-between items-center mb-6 p-6 bg-white shadow-xl rounded-2xl border-t-4 border-emerald-600">
                        {/* ===== LEFT: COMPANY TITLE & FILTER ===== */}
                        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center space-x-3">
                            <FileText size={32} className="text-emerald-600" />
                            <span>{selectedCompany || "All Companies"}</span>

                            {/* Company Filter Dropdown */}
                            <div className="flex items-center space-x-6">
                                {/* 1. Base Company Dropdown (New State & Handler) */}
                                <select
                                    value={baseCompany} // New local state variable for the base company (e.g., "ATP")
                                    onChange={handleBaseCompanyChange} // New local handler
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-800 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="">All Companies</option>
                                    <option value="ATP">ATP</option>
                                    <option value="ATPLAN">ATPLAN</option>
                                    <option value="ARENA">ARENA</option>
                                    <option value="ASN">ASN</option>
                                    <option value="SKY ACTIVE">SKY ACTIVE</option>
                                    <option value="CHIPSOFT">CHIPSOFT</option>
                                    <option value="ALLTIME">ALLTIME</option>
                                </select>

                                {/* 2. Jurisdiction Checkboxes (New State & Handler) */}
                                <div className="flex items-center space-x-4">

                                    {/* State Checkbox */}
                                    <label className="flex items-center text-sm text-gray-700 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="jurisdiction"
                                            value="(state)"
                                            checked={jurisdiction === '(state)'} // New local state for jurisdiction
                                            onChange={handleJurisdictionChange} // New local handler
                                            className="form-radio h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                                        />
                                        <span className="ml-2">State</span>
                                    </label>

                                    {/* Federal Checkbox */}
                                    <label className="flex items-center text-sm text-gray-700 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="jurisdiction"
                                            value="(federal)"
                                            checked={jurisdiction === '(federal)'} // New local state for jurisdiction
                                            onChange={handleJurisdictionChange} // New local handler
                                            className="form-radio h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                                        />
                                        <span className="ml-2">Federal</span>
                                    </label>

                                    {/* Optional: Clear Filter */}
                                    {jurisdiction !== '' && (
                                        <button
                                            // CHANGED: Now calls the dedicated handler
                                            onClick={handleClearJurisdiction}
                                            className="text-xs text-red-500 hover:text-red-700 underline"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>
                        </h1>

                        {/* ===== RIGHT: ACTION BUTTONS (SIDE BY SIDE) ===== */}
                        <div className="flex items-center space-x-3" ref={dropdownRef}>
                            {/* 🔽 EXPORT DATA DROPDOWN */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                                    className="
                                    flex items-center space-x-2
                                    px-6 py-2
                                    text-sm font-semibold
                                    rounded-lg
                                    transition-all duration-200
                                    border-2 border-gray-300
                                    bg-white text-gray-700
                                    shadow-sm
                                    hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-600 hover:shadow-md
                                    focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50
                                    "
                                >
                                    <FileDown size={20} className="text-emerald-600" />
                                    <span>Export</span>
                                    <ChevronDown
                                        size={16}
                                        className={`ml-2 transform transition-transform ${showExportDropdown ? "rotate-180" : "rotate-0"}`}
                                    />
                                </button>

                                {/* 🧾 DROPDOWN MENU */}
                                <div
                                    className={`
                                    absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl
                                    z-50 transition-all duration-300 origin-top-right
                                    ${showExportDropdown ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0 pointer-events-none"}
                                    `}
                                >
                                    <div className="py-2">
                                        <button
                                            onClick={() => handleExportSst(selectedCompany)} // ⬅️ You’ll connect this to your SST API function
                                            className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors duration-150"
                                        >
                                            <Package size={18} className="text-emerald-600 mr-2" />
                                            <span>Export Final SST</span>
                                        </button>
                                        {/* 📄 Export Document */}
                                        <button
                                            onClick={() => {
                                                handleExportDocuments(selectedCompany);
                                                setShowExportDropdown(false);
                                            }}
                                            className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors duration-150"
                                        >
                                            <Files size={18} className="text-emerald-600 mr-2" />
                                            Export Document
                                        </button>

                                        {/* 📊 Export Excel */}
                                        <button
                                            onClick={() => {
                                                handleExportExcel();
                                                setShowExportDropdown(false);
                                            }}
                                            className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors duration-150"
                                        >
                                            <FileSpreadsheet size={18} className="text-emerald-600 mr-2" />
                                            Export Excel
                                        </button>

                                        <div className="border-t border-gray-100 my-2"></div>

                                        {/* 📚 Sub-dropdown trigger */}
                                        <div className="relative group">
                                            <button
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors duration-150"
                                            >
                                                <FileArchive size={18} className="text-emerald-600 mr-2" />

                                                More Data
                                                <ChevronRight size={16} className="ml-3" />
                                            </button>

                                            {/* ➡️ Nested Submenu */}
                                            <div
                                                className="
                                                absolute top-0 left-full ml-1 w-60 bg-white border border-gray-200 rounded-lg shadow-lg
                                                opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2
                                                transition-all duration-200 ease-in-out pointer-events-none group-hover:pointer-events-auto
                                            "
                                            >
                                                <div className="py-1">
                                                    <button
                                                        onClick={() => {
                                                            handleExport("All Companies");
                                                            setShowExportDropdown(false);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm font-medium text-gray-900 bg-emerald-50 hover:bg-emerald-100 transition-colors duration-150"
                                                    >
                                                        📄 Export All Contracts
                                                    </button>

                                                    <div className="border-t border-gray-100 my-1"></div>

                                                    {[
                                                        "ALL", "ATP", "ATP(state)", "ATP(federal)", "ATPLAN", "ATPLAN(state)", "ATPLAN(federal)",
                                                        "ARENA", "ARENA(state)", "ARENA(federal)", "ASN", "ASN(state)", "ASN(federal)",
                                                        "SKY ACTIVE", "SKY ACTIVE(state)", "SKY ACTIVE(federal)", "CHIPSOFT", "CHIPSOFT(state)", "CHIPSOFT(federal)",
                                                        "ALLTIME", "ALLTIME(state)", "ALLTIME(federal)",
                                                    ].map((company) => (
                                                        <button
                                                            key={company}
                                                            onClick={() => {
                                                                handleExport(company);
                                                                setShowExportDropdown(false);
                                                            }}
                                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors duration-150"
                                                        >
                                                            Export {company}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ➕ ADD NEW CONTRACT BUTTON */}
                            <button
                                onClick={() => {
                                    const isOpeningForm = !showForm;
                                    setShowForm(isOpeningForm);
                                    setEditIndex(null);
                                    if (isOpeningForm) {
                                        setFormData(prevData => ({
                                            serviceName: "",
                                            contractValue: "",
                                            contactOfficer: "",
                                            contractNumber: "",
                                            contractDuration: "",
                                            startDate: prevData.startDate || "",
                                            endDate: "",
                                            agencyName: "",
                                            company: "",
                                            progress: "0%",
                                            pdfDocument: null
                                        }));
                                    }
                                }}
                                className={`
                                flex items-center space-x-2
                                px-6 py-2
                                text-sm font-semibold
                                rounded-lg
                                transition-all duration-200
                                border-2
                                ${showForm
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md hover:bg-indigo-700 hover:border-indigo-700 hover:shadow-lg"
                                        : "bg-white text-gray-700 border-gray-300 shadow-sm hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-600 hover:shadow-md"
                                    }
                            `}
                            >
                                {showForm ? (
                                    <>
                                        <X size={20} />
                                        <span>Cancel</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus size={20} />
                                        <span>Add New Contract</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </header>


                    {showForm && (
                        <div className="mb-8 p-6 bg-white border border-gray-200 rounded-2xl shadow-2xl">
                            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
                                {editIndex !== null ? "Edit Contract Record" : "Add New Contract"}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <InputField
                                    name="serviceName"
                                    value={formData.serviceName}
                                    onChange={handleChange as (e: ChangeEvent<HTMLInputElement>) => void}
                                    placeholder="Enter Nama Perkhidmatan..."
                                    label="NAMA PERKHIDMATAN"
                                    icon={<Briefcase size={20} />}
                                />
                                <InputField
                                    name="contractValue"
                                    value={formData.contractValue}
                                    onChange={handleChange as (e: ChangeEvent<HTMLInputElement>) => void}
                                    onBlur={handleContractValueBlur}
                                    placeholder="Enter Nilai Kontrak (RM)..."
                                    label="NILAI KONTRAK (RM)"
                                    icon={<DollarSign size={20} />}
                                />
                                <InputField
                                    name="contractNumber"
                                    value={formData.contractNumber}
                                    onChange={handleChange as (e: ChangeEvent<HTMLInputElement>) => void}
                                    placeholder="Enter No. Kontrak..."
                                    label="NO.KONTRAK"
                                    icon={<Hash size={20} />}
                                />
                                <InputField
                                    name="contactOfficer"
                                    value={formData.contactOfficer}
                                    onChange={handleChange as (e: ChangeEvent<HTMLInputElement>) => void}
                                    placeholder="Enter Pengawai Untuk Dihubungi..."
                                    label="PEGAWAI UNTUK DIHUBUNGI"
                                    icon={<User size={20} />}
                                />
                                <InputField
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange as (e: ChangeEvent<HTMLInputElement>) => void}
                                    placeholder="dd/mm/yyyy"
                                    label="TARIKH TEMPOH KONTRAK MULA"
                                    icon={<Calendar size={20} />}
                                />
                                <InputField
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange as (e: ChangeEvent<HTMLInputElement>) => void}
                                    placeholder="dd/mm/yyyy"
                                    label="TARIKH TEMPOH KONTRAK TAMAT"
                                    icon={<Calendar size={20} />}
                                />

                                {/* NEW: Textarea for multi-line Agency Name/Address */}
                                <div className="md:col-span-2 lg:col-span-3 flex flex-col space-y-1">
                                    <label htmlFor="agencyName" className="text-sm font-semibold text-gray-700">
                                        NAMA & ALAMAT AGENSI
                                    </label>
                                    <div className="relative">
                                        <div className="absolute top-3 left-0 flex items-center pl-3 text-gray-400">
                                            <Briefcase size={20} />
                                        </div>
                                        <textarea
                                            id="agencyName"
                                            name="agencyName"
                                            rows={5}
                                            value={formData.agencyName}
                                            onChange={handleChange}
                                            placeholder="Enter Nama & Alamat Agensi..."
                                            className="w-full border border-gray-300 p-2 pl-10 rounded-lg bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition duration-150 ease-in-out"
                                        />
                                    </div>
                                </div>
                                {/* END NEW TEXTAREA */}
                                {/* NEW: Company Dropdown */}
                                <div className="flex flex-col space-y-1">
                                    <label htmlFor="company" className="text-sm font-semibold text-gray-700">
                                        Syarikat (Company)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute top-3 left-0 flex items-center pl-3 text-gray-400">
                                            <Briefcase size={20} />
                                        </div>
                                        <select
                                            value={baseCompany}
                                            onChange={(e) => setBaseCompany(e.target.value)}
                                            className="w-full border border-gray-300 p-2 pl-10 rounded-lg bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition duration-150 ease-in-out"

                                        >
                                            <option value="">-- Select Company --</option>
                                            <option value="ATP">ATP</option>
                                            <option value="ATPLAN">ATPLAN</option>
                                            <option value="ARENA">ARENA</option>
                                            <option value="ASN">ASN</option>
                                            <option value="SKY ACTIVE">SKY ACTIVE</option>
                                            <option value="CHIPSOFT">CHIPSOFT</option>
                                            <option value="ALLTIME">ALLTIME</option>
                                        </select>

                                        <div className="flex space-x-6 mt-2">
                                            {/* 1. State Radio Button */}
                                            <label
                                                htmlFor="state-jurisdiction"
                                                className="flex items-center cursor-pointer p-2 rounded-lg transition duration-150 ease-in-out hover:bg-indigo-50"
                                            >
                                                <input
                                                    type="radio"
                                                    id="state-jurisdiction"
                                                    name="add_jurisdiction"
                                                    value="(state)"
                                                    checked={jurisdiction === '(state)'}
                                                    onChange={(e) => setJurisdiction(e.target.value)}
                                                    // Tailwind class for radio button styling
                                                    className="form-radio h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                                />
                                                <span className="ml-2 text-gray-700 font-medium">State</span>
                                            </label>

                                            {/* 2. Federal Radio Button */}
                                            <label
                                                htmlFor="federal-jurisdiction"
                                                className="flex items-center cursor-pointer p-2 rounded-lg transition duration-150 ease-in-out hover:bg-indigo-50"
                                            >
                                                <input
                                                    type="radio"
                                                    id="federal-jurisdiction"
                                                    name="add_jurisdiction"
                                                    value="(federal)"
                                                    checked={jurisdiction === '(federal)'}
                                                    onChange={(e) => setJurisdiction(e.target.value)}
                                                    // Tailwind class for radio button styling
                                                    className="form-radio h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                                />
                                                <span className="ml-2 text-gray-700 font-medium">Federal</span>
                                            </label>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Choose the company associated with this contract.
                                    </p>
                                </div>
                                {/* END NEW DROPDOWN */}

                            </div>

                            <div className="flex justify-end mt-8 pt-4 border-t border-gray-200">
                                <button
                                    onClick={handleSave}
                                    className={`
                                    // Base Styling
                                    flex items-center space-x-2
                                    px-6 py-2
                                    text-sm font-semibold
                                    rounded-lg
                                    transition-all duration-200
                                    w-auto
                                    border-2
                                                                                        
                                    ${editIndex !== null
                                            ? `
                                            // Update Contract State (Modification/Caution color)
                                            bg-amber-500 hover:bg-amber-600 border-indigo-600
                                            focus:ring-amber-300
                                        `
                                            : `
                                        bg-white text-gray-700 border-gray-300
                                        shadow-sm
                                        // Hover Effect (Inherited from Add Another Item)
                                        hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-600 hover:shadow-md
                                        // Focus Ring (Inherited from Add Another Item)
                                        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50                                        `
                                        }
                                `}
                                >
                                    {editIndex !== null
                                        ? "💾 Update Contract"
                                        : "➕ Save Contract"}
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end mb-4">
                        <div className="flex items-center w-80 border-2 border-gray-300 rounded-lg overflow-hidden shadow-sm transition-all duration-200">
                            {/* 🏢 Agency Input */}
                            <input
                                type="text"
                                placeholder="Filter by agency..."
                                value={selectedAgency}
                                onChange={(e) => setSelectedAgency(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleCompanyFilterChange(selectedCompany);
                                }}
                                className="
                                flex-grow px-3 py-2 text-sm text-gray-700
                                focus:outline-none focus:ring-0
                                placeholder-gray-400
                                bg-white
                            "
                            />

                            {/* 🎚 Filter Button (styled like Export Data) */}
                            <button
                                onClick={() => handleCompanyFilterChange(selectedCompany)}
                                className="
                                flex items-center space-x-2
                                px-4 py-2
                                text-sm font-semibold
                                text-gray-700
                                bg-white
                                border-l-2 border-gray-300
                                transition-all duration-200

                                hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-400
                                focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50
                            "
                            >
                                <SlidersHorizontal size={18} />
                                <span>Filter</span>
                            </button>
                        </div>
                    </div>



                    {/* Table section */}
                    {contracts.length > 0 ? (
                        <div className="overflow-x-auto bg-white rounded-2xl shadow-2xl">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 sticky top-0 z-10">
                                    <tr>
                                        {renderTableHeader("No.", "text-center")}
                                        {renderTableHeader("Nama Perkhidmatan")}
                                        {renderTableHeader("Nilai (RM)")}
                                        {renderTableHeader("Pegawai")}
                                        {renderTableHeader("No. Kontrak")}
                                        {renderTableHeader("Tempoh (Bln)")}
                                        {renderTableHeader("Mula")}
                                        {renderTableHeader("Tamat")}
                                        {renderTableHeader("Agensi")}
                                        {renderTableHeader("Progres")}
                                        {
                                            renderTableHeader("Tindakan", "text-center")}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {contracts.map((item, i) => (
                                        <tr
                                            key={i}
                                            className="hover:bg-indigo-50 transition duration-150 ease-in-out"
                                        >
                                            {renderTableCell(i + 1, "text-center font-semibold text-gray-500")}

                                            {renderTableCell(item.serviceName, "font-medium")}
                                            {renderTableCell(
                                                item.contractValue,
                                                "font-mono text-green-700 font-bold text-right"
                                            )}
                                            {renderTableCell(item.contactOfficer)}
                                            {renderTableCell(item.contractNumber)}
                                            {renderTableCell(item.contractDuration, "text-center")}
                                            {renderTableCell(item.startDate)}
                                            {renderTableCell(item.endDate)}

                                            {/* NEW: Formatted Agency Name/Address Cell */}
                                            {renderTableCell(
                                                <div
                                                    dangerouslySetInnerHTML={{
                                                        __html: item.agencyName
                                                            .split('\n')
                                                            .map((line, index) => {
                                                                // Bold the first line (Agency Name)
                                                                if (index === 0) {
                                                                    return `<strong>${line}</strong>`;
                                                                }
                                                                return line;
                                                            })
                                                            .join('<br />'), // Join lines with HTML break
                                                    }}
                                                />
                                            )}
                                            {/* END NEW CELL */}

                                            {renderTableCell(<ProgressBar progress={item.progress} />)}
                                            {(
                                                <td className="px-4 py-3 align-top text-center">
                                                    <div className="flex items-start justify-center">

                                                        {/* Main Action Buttons Group */}
                                                        <div className="flex items-center space-x-1">
                                                            <button
                                                                onClick={() => handleEdit(i)}
                                                                className="p-1 rounded-full text-indigo-600 hover:bg-indigo-100"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(i)}
                                                                className="p-1 rounded-full text-red-600 hover:bg-red-100"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>

                                                            {/* 📄 Document button (toggle) */}
                                                            <button
                                                                onClick={() =>
                                                                    setSelectedDocumentRow(selectedDocumentRow === i ? null : i)
                                                                }
                                                                className="p-1 rounded-full text-emerald-600 hover:bg-emerald-100"
                                                                title="Manage Document"
                                                            >
                                                                <FileText size={16} />
                                                            </button>
                                                        </div>


                                                        {/* 🟢 Conditionally rendered icons (upload/preview) */}
                                                        {selectedDocumentRow === i && (
                                                            <div className="flex items-center space-x-1 ml-2 animate-fade-in">
                                                                {/* 👁 Preview */}
                                                                <button
                                                                    onClick={() => handlePreview(item.serviceName)}
                                                                    className="p-1 rounded-full text-blue-600 hover:bg-blue-100"
                                                                    title="Preview PDF"
                                                                >
                                                                    <Eye size={16} />
                                                                </button>

                                                                {/* ⬆ Upload */}
                                                                <button
                                                                    onClick={() => handleUpload(item.serviceName)}
                                                                    className="p-1 rounded-full text-amber-600 hover:bg-amber-100"
                                                                    title="Upload PDF"
                                                                >
                                                                    <Upload size={16} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {hasMore && (
                                <div className="flex justify-center py-8 border-t border-gray-100 bg-gray-50/50">
                                    <button
                                        onClick={() => {
                                            const nextPage = page + 1;
                                            setPage(nextPage);
                                            fetchContracts(nextPage);
                                        }}
                                        disabled={loading} // Assuming you have a loading state
                                        className="group relative flex items-center justify-center px-8 py-3 
                                            bg-white border border-gray-200 text-slate-600 font-semibold text-sm 
                                            rounded-full shadow-sm transition-all duration-300
                                            hover:border-green-500 hover:text-green-600 hover:shadow-md hover:-translate-y-0.5
                                            active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                        ) : (
                                            <>
                                                <span className="tracking-wider uppercase text-[11px]">Load More Contracts</span>
                                                <ChevronDown size={16} className="ml-2 group-hover:translate-y-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-16 bg-white rounded-2xl shadow-xl text-center border-2 border-dashed border-gray-300">
                            <p className="text-xl text-gray-500 italic">
                                No contract records found. Click &ldquo;Add New Contract&rdquo; to begin!
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </ProtectedRoute>
    );
}