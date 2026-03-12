"use client";

import React, { ElementType, useCallback, useEffect, useState } from "react";
import { Edit2, Trash2, ChevronDown, ChevronUp, Save, X, Plus, FileText, Printer, Settings, BookOpen, Layers, Box, Minus } from "lucide-react"; // Added 
import ProtectedRoute from "@/components/ProtectedRoute";

// Minus for visual toggle

// Updated type definition to include all fields
type ASN29 = {
    id: number;
    model?: string | null;
    proposedModel?: string | null;
    monthlyRecommendedPrintVolume?: string | null;
    fax?: string | null;
    inner?: string | null;
    booklet?: string | null;
    puncher?: string | null;
    threeTrays?: string | null;
    fiveTrays?: string | null;
    details?: string | null;
    staple?: string | null;
};

// Initial state for a new model, matching the ASN29 type without the ID
const initialNewModel: Omit<ASN29, 'id'> = {
    model: "",
    proposedModel: "",
    monthlyRecommendedPrintVolume: "",
    fax: "",
    inner: "",
    booklet: "",
    puncher: "",
    threeTrays: "",
    fiveTrays: "",
    details: "",
    staple: "",
};

// List of fields that are edited/created via text area
const longTextareaFields: { key: keyof Omit<ASN29, 'id'>, title: string, rows: number, icon?: ElementType }[] = [
    { key: 'model', title: 'Model', rows: 2, icon: Printer },
    { key: 'proposedModel', title: 'Proposed Model', rows: 2, icon: Printer },
    { key: 'monthlyRecommendedPrintVolume', title: 'Monthly Print Volume', rows: 3, icon: FileText },
    { key: 'fax', title: 'Fax Features', rows: 4, icon: Settings },
    { key: 'inner', title: 'Inner Finisher', rows: 4, icon: Settings },
    { key: 'booklet', title: 'Booklet Finisher', rows: 4, icon: BookOpen },
    { key: 'puncher', title: 'Puncher', rows: 2, icon: Settings },
    { key: 'threeTrays', title: '3 Trays', rows: 3, icon: Layers },
    { key: 'fiveTrays', title: '5 Trays', rows: 3, icon: Box },
    { key: 'staple', title: 'Staple Finisher', rows: 4, icon: Settings },
    { key: 'details', title: 'General Details', rows: 6, icon: FileText },
];

// List of only the extended fields for the EditDetailsRow
const extendedFields = longTextareaFields.filter(field =>
    field.key !== 'model' &&
    field.key !== 'proposedModel' &&
    field.key !== 'monthlyRecommendedPrintVolume'
);


// --- Details Display Component (for View Specs) ---
const DetailsRow = ({ row, colSpan, onToggle }: { row: ASN29, colSpan: number, onToggle: () => void }) => {
    const detailFields: { key: keyof ASN29, title: string, icon: ElementType }[] = extendedFields as { key: keyof ASN29, title: string, icon: ElementType }[];

    const hasContent = detailFields.some(field => row[field.key]);

    return (
        <tr>
            <td colSpan={colSpan} className="p-0">
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 border-l-4 border-blue-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {hasContent ? (
                            detailFields.map(field => {
                                const content = row[field.key];
                                const Icon = field.icon;
                                if (content) {
                                    return (
                                        <div key={field.key} className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <Icon className="text-blue-600" size={16} />
                                                </div>
                                                <p className="font-semibold text-slate-800">{field.title}</p>
                                            </div>
                                            {/* Use <pre> tag for retaining line breaks but use white-space-pre-wrap for text wrapping */}
                                            <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans">{content}</pre>
                                        </div>
                                    );
                                }
                                return null;
                            })
                        ) : (
                            <p className="text-red-500 col-span-full">No detailed specifications available for this model.</p>
                        )}
                    </div>
                    <div className="flex justify-end mt-6">
                        <button
                            onClick={onToggle}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all"
                        >
                            <ChevronUp size={16} />
                            Hide Specs
                        </button>
                    </div>
                </div>
            </td>
        </tr>
    );
}

// --- Edit Details Component (for Edit Mode) ---
const EditDetailsRow = ({ editModel, onInputChange, onSave, onCancel, colSpan }: {
    editModel: ASN29,
    onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>, key: keyof ASN29) => void,
    onSave: () => void,
    onCancel: () => void,
    colSpan: number,
}) => {
    return (
        <tr>
            <td colSpan={colSpan} className="p-0">
                <div className="bg-white p-6 border-l-4 border-yellow-500 shadow-inner">
                    <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                        <Edit2 size={20} className="text-yellow-500" />
                        Edit Extended Specifications
                    </h3>

                    {/* Extended Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {extendedFields.map(field => {
                            const Icon = field.icon;
                            const key = field.key as keyof ASN29; // Safe cast since we filtered out the main three
                            return (
                                <div key={field.key} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                        {Icon && <Icon size={16} className="text-slate-500" />}
                                        {field.title}
                                    </label>
                                    <textarea
                                        value={editModel[key] ?? ""}
                                        onChange={(e) => onInputChange(e as React.ChangeEvent<HTMLTextAreaElement>, key)}
                                        className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all resize-vertical text-sm"
                                        rows={field.rows}
                                        placeholder={`Enter ${field.title.toLowerCase()} details`}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {/* Save/Cancel Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                        <button
                            onClick={onSave}
                            className="flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-sm font-medium shadow-md"
                        >
                            <Save size={16} />
                            Save Changes
                        </button>
                        <button
                            onClick={onCancel}
                            className="flex items-center gap-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-all text-sm font-medium shadow-md"
                        >
                            <X size={16} />
                            Cancel
                        </button>
                    </div>
                </div>
            </td>
        </tr>
    );
}

// --- Component Start ---
export default function ASN29Page() {
    const [data, setData] = useState<ASN29[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editModel, setEditModel] = useState<ASN29 | null>(null);
    const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
    const [newModel, setNewModel] = useState<Omit<ASN29, 'id'>>(initialNewModel);
    // 💡 NEW STATE: State to control the visibility of the creation form
    const [isCreationFormOpen, setIsCreationFormOpen] = useState(false);

    const apiBase = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/ASN29Series`;

    const loadData = useCallback(async () => {
        try {
            const res = await fetch(apiBase);
            const json = await res.json();
            setData(json.map((item: ASN29) => ({
                ...item,
                model: item.model ?? null,
                proposedModel: item.proposedModel ?? null,
                monthlyRecommendedPrintVolume: item.monthlyRecommendedPrintVolume ?? null,
                fax: item.fax ?? null,
                inner: item.inner ?? null,
                booklet: item.booklet ?? null,
                puncher: item.puncher ?? null,
                threeTrays: item.threeTrays ?? null,
                fiveTrays: item.fiveTrays ?? null,
                details: item.details ?? null,
                staple: item.staple ?? null,
            })));
        } catch (error) {
            console.error("Failed to load data:", error);
        }
    }, [apiBase]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleNewInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, key: keyof Omit<ASN29, 'id'>) => {
        setNewModel((prev) => ({ ...prev!, [key]: e.target.value }));
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, key: keyof ASN29) => {
        setEditModel((prev) => ({ ...prev!, [key]: e.target.value }));
    };

    // 💡 NEW FUNCTION: Toggles the visibility state
    const toggleCreationForm = () => {
        setIsCreationFormOpen(prev => !prev);
    };

    const createRow = async () => {
        if (!newModel.model) {
            alert("Model field is required.");
            return;
        }

        try {
            const res = await fetch(apiBase, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newModel),
            });

            if (!res.ok) {
                const errorText = res.statusText || (await res.text());
                throw new Error(`API Creation Failed: ${res.status} - ${errorText}`);
            }

            setNewModel(initialNewModel);
            await loadData();
            alert("New record created successfully!");
            // 💡 NEW: Close the form after successful creation
            setIsCreationFormOpen(false);

        } catch (error) {
            console.error("Failed to create new record:", error);
            alert(`Error creating record: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    };

    const startEdit = (row: ASN29) => {
        setEditingId(row.id);
        setEditModel({ ...row });
        setExpandedRowId(null);
        // 💡 NEW: Close the creation form when starting an edit
        setIsCreationFormOpen(false);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditModel(null);
    };

    const saveEdit = async () => {
        if (!editModel) return;

        try {
            const res = await fetch(`${apiBase}/${editModel.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editModel),
            });

            if (!res.ok) {
                const errorText = res.statusText || (await res.text());
                throw new Error(`API Update Failed: ${res.status} - ${errorText}`);
            }

            setEditingId(null);
            setEditModel(null);
            await loadData();

        } catch (error) {
            console.error("Failed to save data:", error);
            alert(`Error saving data: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    };

    const deleteRow = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this row?")) return;

        try {
            const res = await fetch(`${apiBase}/${id}`, { method: "DELETE" });

            if (!res.ok) {
                const errorText = res.statusText || (await res.text());
                throw new Error(`API Delete Failed: ${res.status} - ${errorText}`);
            }

            await loadData();

        } catch (error) {
            console.error("Failed to delete data:", error);
            alert(`Error deleting row: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    };

    const toggleDetails = (id: number) => {
        setExpandedRowId(id === expandedRowId ? null : id);
        setEditingId(null); // Close edit mode if viewing details
        // 💡 NEW: Close the creation form when viewing details
        setIsCreationFormOpen(false);
    }

    // Calculate the number of columns in the main table for colspan
    const mainTableColCount = 5;

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-light text-slate-800 tracking-tight mb-2">
                            Model Management
                        </h1>
                        <p className="text-slate-500">Manage printer models and specifications</p>
                    </div>

                    {/* Creation Form Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCreationFormOpen ? 'bg-orange-100' : 'bg-emerald-100'}`}>
                                    {isCreationFormOpen ? <Minus className="text-orange-600" size={20} /> : <Plus className="text-emerald-600" size={20} />}
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-800">Add New Model</h2>
                                </div>
                            </div>
                            {/* 💡 NEW BUTTON: Toggle Button */}
                            <button
                                onClick={toggleCreationForm}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium shadow-md ${isCreationFormOpen ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                            >
                                {isCreationFormOpen ? (
                                    <>
                                        <ChevronUp size={16} />
                                        Hide Form
                                    </>
                                ) : (
                                    <>
                                        <Plus size={16} />
                                        Show Form
                                    </>
                                )}
                            </button>
                            {/* 👆 NEW BUTTON */}
                        </div>

                        {/* 💡 NEW: Conditional rendering of the form content */}
                        {isCreationFormOpen && (
                            <>
                                {/* Creation Form - Uses the full set of fields including the main three */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {longTextareaFields.map(field => {
                                        const Icon = field.icon;
                                        return (
                                            <div key={field.key}>
                                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                                    {Icon && <Icon size={16} className="text-slate-500" />}
                                                    {field.title}{field.key === 'model' ? ' *' : ''}
                                                </label>
                                                <textarea
                                                    value={newModel[field.key] ?? ""}
                                                    onChange={(e) => handleNewInputChange(e, field.key)}
                                                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all resize-vertical"
                                                    rows={field.rows}
                                                    placeholder={`Enter ${field.title.toLowerCase()}`}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex justify-end mt-6 pt-6 border-t border-slate-200">
                                    <button
                                        onClick={createRow}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-lg font-medium"
                                    >
                                        <Plus size={18} />
                                        Create Record
                                    </button>
                                </div>
                            </>
                        )}
                        {/* 👆 NEW: End Conditional rendering */}
                    </div>

                    {/* Table Section */}
                    <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                            ID
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                            Model
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                            Proposed Model
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                            Monthly Print Volume
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                {/* 👇 FIX APPLIED HERE: The JSX block starts immediately after <tbody> to avoid whitespace */}
                                <tbody className="bg-white divide-y divide-slate-100">{
                                    data.length === 0 && !editingId ? (
                                        <tr>
                                            <td colSpan={mainTableColCount} className="px-6 py-12 text-center text-slate-500">
                                                <Printer className="mx-auto text-slate-300 mb-4" size={48} />
                                                <p className="font-medium">No records found</p>
                                                <p className="text-sm mt-1">Create your first ASN 29 series record</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        data.map((row) => (
                                            <React.Fragment key={row.id}>
                                                <tr className="hover:bg-slate-50 transition-colors">
                                                    {editingId === row.id && editModel ? (
                                                        /* EDIT MODE - Main Fields */
                                                        <>
                                                            <td className="px-6 py-4 text-sm font-medium text-slate-900 bg-yellow-50/50">
                                                                #{row.id}
                                                            </td>
                                                            <td className="px-6 py-2 bg-yellow-50/50">
                                                                <input
                                                                    value={editModel?.model ?? ""}
                                                                    onChange={(e) => handleEditInputChange(e, 'model')}
                                                                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                                                                />
                                                            </td>
                                                            <td className="px-6 py-2 bg-yellow-50/50">
                                                                <input
                                                                    value={editModel?.proposedModel ?? ""}
                                                                    onChange={(e) => handleEditInputChange(e, 'proposedModel')}
                                                                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                                                                />
                                                            </td>
                                                            <td className="px-6 py-2 bg-yellow-50/50">
                                                                <textarea
                                                                    value={editModel?.monthlyRecommendedPrintVolume ?? ""}
                                                                    onChange={(e) => handleEditInputChange(e, 'monthlyRecommendedPrintVolume')}
                                                                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none resize-vertical text-sm"
                                                                    rows={2}
                                                                />
                                                            </td>
                                                            <td className="px-6 py-4 bg-yellow-50/50">
                                                                <div className="flex gap-2 mb-2">
                                                                    {/* Save/Cancel buttons removed from here to the EditDetailsRow for a cleaner main row */}
                                                                </div>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        /* VIEW MODE */
                                                        <>
                                                            <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                                                #{row.id}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="max-w-xs text-sm text-slate-800" title={row.model ?? ""}>
                                                                    {row.model}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="max-w-xs truncate text-sm text-slate-800" title={row.proposedModel ?? ""}>
                                                                    {row.proposedModel}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="max-w-xs truncate text-sm text-slate-800" title={row.monthlyRecommendedPrintVolume ?? ""}>
                                                                    {row.monthlyRecommendedPrintVolume}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex gap-2 mb-2">
                                                                    <button
                                                                        onClick={() => startEdit(row)}
                                                                        className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                                        title="Edit"
                                                                    >
                                                                        <Edit2 size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => deleteRow(row.id)}
                                                                        className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                                <button
                                                                    onClick={() => toggleDetails(row.id)}
                                                                    className={`w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium ${row.id === expandedRowId
                                                                        ? 'bg-slate-800 text-white'
                                                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                                        }`}
                                                                >
                                                                    {row.id === expandedRowId ? (
                                                                        <>
                                                                            <ChevronUp size={16} />
                                                                            Hide Specs
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <ChevronDown size={16} />
                                                                            View Specs
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>

                                                {/* Conditionally render the EditDetailsRow for extended specs */}
                                                {editingId === row.id && editModel && (
                                                    <EditDetailsRow
                                                        editModel={editModel}
                                                        onInputChange={handleEditInputChange as (e: React.ChangeEvent<HTMLTextAreaElement>, key: keyof ASN29) => void}
                                                        onSave={saveEdit}
                                                        onCancel={cancelEdit}
                                                        colSpan={mainTableColCount}
                                                    />
                                                )}

                                                {/* Conditionally render the DetailsRow for viewing specs */}
                                                {expandedRowId === row.id && !editingId && (
                                                    <DetailsRow
                                                        row={row}
                                                        colSpan={mainTableColCount}
                                                        onToggle={() => toggleDetails(row.id)}
                                                    />
                                                )}
                                            </React.Fragment>
                                        ))
                                    )}
                                    {/* 👆 FIX APPLIED HERE: The closing curly brace is flush against the </tbody> tag */}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}