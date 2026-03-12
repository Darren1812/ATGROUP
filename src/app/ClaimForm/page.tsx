"use client";


import React, { useState, useEffect } from 'react';
import { FileText, Plus, Pencil, Calendar, Loader2, X, Save, Trash2, Eye, Download, Search, Filter } from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation';

const apiBase = `${process.env.NEXT_PUBLIC_API_BASE_URL}`;
const ProtectedRoute: React.FC<React.PropsWithChildren> = ({ children }) => <>{children}</>;

interface Claim {
    id: number;
    date: string;
    staff: string;
    condition: string;
}

const ClaimFormsPage: React.FC = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [claims, setClaims] = useState<Claim[]>([]);
    const [showForm, setShowForm] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    // New claim form state
    const [newClaimData, setNewClaimData] = useState({
        monthYear: '',
        claimFormType: '',
    });

    // Edit claim state
    const [editingClaim, setEditingClaim] = useState<Claim | null>(null);
    const [editFormData, setEditFormData] = useState({ date: '', staff: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);

    // Fetch claims
    useEffect(() => {
        const fetchClaims = async () => {
            if (!user?.name) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            const staffName = encodeURIComponent(user.name);
            const url = `${apiBase}/api/Claims?staffName=${staffName}`;

            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data: Claim[] = await response.json();
                setClaims(data);
            } catch (error) {
                console.error("Error fetching claims:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchClaims();
    }, [user]);

    // Create new claim
    const handleCreateNewClaim = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.name) return alert("Staff name is required.");

        if (!newClaimData.monthYear) {
            return alert("Please select Month/Year.");
        }

        // Check for duplicate
        const duplicate = claims.find(c => c.date === newClaimData.monthYear);
        if (duplicate) {
            return alert(`A claim form for ${newClaimData.monthYear} already exists!`);
        }

        setIsSubmitting(true);
        const createDto = {
            MonthYear: newClaimData.monthYear,
            ClaimFormType: newClaimData.claimFormType,
            StaffName: user.name,
        };

        try {
            const response = await fetch(`${apiBase}/api/Claims`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createDto),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create claim: ${response.statusText}. Details: ${errorText}`);
            }
            const newClaim: Claim = await response.json();
            setClaims(prev => [...prev, newClaim]);
            setNewClaimData({ monthYear: '', claimFormType: '' });
            setShowForm(false);
        } catch (error) {
            console.error(error);
            alert("Error creating claim. Check console for details.");
        } finally {
            setIsSubmitting(false);
        }
    };


    // Edit handlers
    const handleEdit = (claim: Claim) => {
        setEditingClaim(claim);
        setEditFormData({ date: claim.date, staff: claim.staff });
        setIsEditing(true);
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateClaim = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingClaim) return;

        try {
            const response = await fetch(`${apiBase}/api/Claims/${editingClaim.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ MonthYear: editFormData.date, StaffName: editFormData.staff }),
            });
            if (!response.ok) throw new Error(`Failed to update claim: ${response.statusText}`);

            setClaims(prev =>
                prev.map(c => c.id === editingClaim.id ? { ...c, date: editFormData.date, staff: editFormData.staff } : c)
            );
            setIsEditing(false);
            setEditingClaim(null);
        } catch (error) {
            console.error(error);
            alert("Error updating claim.");
        }
    };

    // Delete handler
    const handleDeleteClaim = async (id: number) => {
        if (!confirm("Are you sure you want to delete this claim?")) return;
        setIsDeleting(id);

        try {
            const response = await fetch(`${apiBase}/api/Claims/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error(`Failed to delete claim: ${response.statusText}`);
            setClaims(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error(error);
            alert("Error deleting claim.");
        } finally {
            setIsDeleting(null);
        }
    };

    const handleAddNewClaim = () => {
        setShowForm(prev => !prev);
        if (showForm) setNewClaimData({ monthYear: '', claimFormType: '' });
    };

    const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewClaimData(prev => ({ ...prev, [name]: value }));
    };

    const handleViewClaim = (id: number) => {
        router.push(`/EditClaimPage?id=${id}`);
    };

    const handleExport = (id: number) => alert(`Exporting Claim ${id}`);

    // Filter claims
    const filteredClaims = claims.filter(claim => {
        const matchesSearch = claim.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
            claim.staff.toLowerCase().includes(searchQuery.toLowerCase()) ||
            claim.id.toString().includes(searchQuery);
        const matchesStatus = statusFilter === "ALL" || claim.condition === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: claims.length,
        waiting: claims.filter(c => c.condition === 'WAITING').length,
        approved: claims.filter(c => c.condition === 'APPROVED').length,
    };
    const fetchClaimDetailsByClaimId = async (claimId: number) => {
        try {
            const response = await fetch(`${apiBase}/api/ClaimDetails/ByClaim/${claimId}`);
            if (!response.ok) throw new Error(`Failed to fetch claim details. Status: ${response.status}`);
            const data: { id: number; attach: string | null; claimType: number }[] = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching claim details:", error);
            return [];
        }
    };

    const handleExportClaim = async (claimId: number) => {
        // Fetch all claim details
        const claimDetails = await fetchClaimDetailsByClaimId(claimId);

        // Filter claim types that need attachment (ignore type 8)
        const missingAttachments = claimDetails.filter(d => d.attach === null && d.claimType !== 8);

        if (missingAttachments.length > 0) {
            alert("Please make sure all receipts are attached before exporting!");
            return;
        }

        // If all attachments exist, run original export function
        handleExport(claimId);
    };

    return (
        <ProtectedRoute>
            <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* HEADER */}
                    <div className="bg-white shadow-lg rounded-2xl p-6 mb-6 border-l-4 border-emerald-500">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                            <div>
                                <h1 className="text-3xl font-light text-slate-800 flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                        <FileText className="text-emerald-600" size={24} />
                                    </div>
                                    <span>Claim Forms Management</span>
                                </h1>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <p className="text-xs text-slate-500 font-medium">Total Claims</p>
                                        <p className="text-2xl font-light text-slate-800">{stats.total}</p>
                                    </div>
                                    <div className="bg-amber-50 rounded-lg p-3">
                                        <p className="text-xs text-amber-600 font-medium">Waiting</p>
                                        <p className="text-2xl font-light text-amber-900">{stats.waiting}</p>
                                    </div>
                                    <div className="bg-emerald-50 rounded-lg p-3">
                                        <p className="text-xs text-emerald-600 font-medium">Approved</p>
                                        <p className="text-2xl font-light text-emerald-900">{stats.approved}</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleAddNewClaim}
                                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all font-medium whitespace-nowrap ${showForm
                                    ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                    : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                                    }`}
                                disabled={isSubmitting}
                            >
                                {showForm ? <X size={20} /> : <Plus size={20} />}
                                <span>{showForm ? "Cancel" : "New Claim"}</span>
                            </button>
                        </div>
                    </div>

                    {/* NEW CLAIM FORM */}
                    {showForm && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                        <Plus className="text-emerald-600" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-slate-800">Create New Claim</h3>
                                        <p className="text-sm text-slate-500">Fill in the details below</p>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="monthYear" className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                        <Calendar size={16} className="text-emerald-500" />
                                        Select Month and Year
                                    </label>
                                    <input
                                        type="month"
                                        id="monthYear"
                                        name="monthYear"
                                        value={newClaimData.monthYear}
                                        onChange={handleFormInputChange}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                        required
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                                    <button
                                        type="button"
                                        onClick={handleAddNewClaim}
                                        className="px-4 py-2.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCreateNewClaim}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={18} />
                                                Create Claim
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* EDIT MODAL */}
                    {isEditing && editingClaim && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-amber-50 to-yellow-50 rounded-t-2xl">
                                    <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                                        <Pencil size={20} className="text-amber-600" />
                                        Edit Claim #{editingClaim.id}
                                    </h3>
                                    <button
                                        onClick={() => { setIsEditing(false); setEditingClaim(null); }}
                                        className="text-slate-400 hover:text-slate-600 transition-colors rounded-full p-2 hover:bg-slate-100"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Month/Year</label>
                                        <input
                                            type="month"
                                            name="date"
                                            value={editFormData.date}
                                            onChange={handleEditInputChange}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Staff Name</label>
                                        <input
                                            type="text"
                                            name="staff"
                                            value={editFormData.staff}
                                            onChange={handleEditInputChange}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                                            required
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                                        <button
                                            type="button"
                                            onClick={() => { setIsEditing(false); setEditingClaim(null); }}
                                            className="px-4 py-2.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleUpdateClaim}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                                        >
                                            <Save size={18} />
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SEARCH AND FILTER */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by ID, date, or staff name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="pl-10 pr-8 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white transition-all appearance-none cursor-pointer"
                                >
                                    <option value="ALL">All Status</option>
                                    <option value="WAITING">Waiting</option>
                                    <option value="APPROVED">Approved</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* CLAIMS TABLE */}
                    <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-slate-200">
                        {isLoading ? (
                            <div className="flex flex-col justify-center items-center py-16">
                                <Loader2 size={48} className="animate-spin text-emerald-500 mb-4" />
                                <p className="text-lg text-slate-600">Loading claims...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ID</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Claim Form</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Staff Name</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {filteredClaims.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-16 text-center">
                                                    <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                                                    <p className="text-slate-500 font-medium mb-2">
                                                        {searchQuery || statusFilter !== "ALL" ? "No claims match your filters" : "No claims found"}
                                                    </p>
                                                    <p className="text-sm text-slate-400">
                                                        {searchQuery || statusFilter !== "ALL" ? "Try adjusting your search or filters" : "Click 'New Claim' to create your first one"}
                                                    </p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredClaims.map(claim => (
                                                <tr key={claim.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                        #{claim.id}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                                                        CLAIM FORM {claim.date}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                        {claim.staff}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${claim.condition === 'WAITING'
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : 'bg-emerald-100 text-emerald-800'
                                                            }`}>
                                                            {claim.condition}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleViewClaim(claim.id)}
                                                                className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                                title="View Details"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleExportClaim(claim.id)}
                                                                className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                                title="Export"
                                                            >
                                                                <Download size={16} />
                                                            </button>

                                                            <button
                                                                onClick={() => handleEdit(claim)}
                                                                className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                                                title="Edit"
                                                            >
                                                                <Pencil size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteClaim(claim.id)}
                                                                className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                                disabled={isDeleting === claim.id}
                                                                title="Delete"
                                                            >
                                                                {isDeleting === claim.id ? (
                                                                    <Loader2 size={16} className="animate-spin" />
                                                                ) : (
                                                                    <Trash2 size={16} />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </ProtectedRoute>
    );
};

export default ClaimFormsPage;