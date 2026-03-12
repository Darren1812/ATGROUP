"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    FileText, Calendar, Loader2, ArrowLeft, Plus, X, Save, AlertTriangle, Edit, Trash2, DollarSign, MapPin, Receipt, Clock, Paperclip, Eye
} from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

const apiBase = `${process.env.NEXT_PUBLIC_API_BASE_URL}`;

interface ClaimFormApi {
    id: number;
    date: string;
    staff: string;
    claimtype: string;
    condition: string;
}

interface ClaimDetailApi {
    id: number;
    claimFormId: number;
    company: string;
    amount: number;
    claimType: number;
    date?: string;
    km: number;
    otherClaimType?: string;
    attach?: string | null;
}

interface ClaimDetailInput {
    date: string;
    company: string;
    amount: number;
    claimType: string;
    km: number;
    otherClaimType: string;
}

interface OTClaimApi {
    id: number;
    date: string;
    customer: string;
    time: string;
    hours: number;
    claimid: number;
}

interface OTClaimInput {
    date: string;
    customer: string;
    time: string;
    hours: number;
}

interface DetailModalProps {
    claimFormId?: number;
    detailToEdit?: ClaimDetailApi | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface OTModalProps {
    claimId: number;
    otToEdit?: OTClaimApi | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CLAIM_TYPES_MAP: { [key: number]: string } = {
    1: "Parking & Toll", 2: "Petrol", 3: "Entertainment",
    4: "Staff Welfare", 5: "Hotel & Transport", 6: "Tools",
    7: "Medical Claim", 8: "Mileage (KM)", 9: "Other"
};

const CLAIM_TYPES_STRINGS = [
    "Parking & Toll", "Petrol", "Entertainment", "Staff Welfare", "Hotel & Transport",
    "Tools", "Medical Claim", "Mileage (KM)"
];

const getClaimTypeString = (id: number) => CLAIM_TYPES_MAP[id] || `Unknown (${id})`;

const OFF_WORK_END = { hour: 17, minute: 30 };
const OFF_WORK_TOTAL_MINUTES = OFF_WORK_END.hour * 60 + OFF_WORK_END.minute;

const normalizeDateForInput = (value?: string | null) => {
    if (!value) return new Date().toISOString().substring(0, 10);
    if (value.includes('/')) {
        const [month, day, year] = value.split('/');
        if (month && day && year) {
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
    }
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) {
        return new Date().toISOString().substring(0, 10);
    }
    return parsed.toISOString().substring(0, 10);
};

const formatDateForApi = (input: string) => {
    if (!input) return new Date().toLocaleDateString('en-US');
    const [year, month, day] = input.split('-');
    if (year && month && day) {
        const monthNumber = parseInt(month, 10);
        const dayNumber = parseInt(day, 10);
        return `${monthNumber}/${dayNumber}/${year}`;
    }
    const parsed = new Date(input);
    return isNaN(parsed.getTime()) ? input : parsed.toLocaleDateString('en-US');
};

const parseTimeStringToMinutes = (value: string): number | null => {
    if (!value) return null;
    let trimmed = value.trim().toLowerCase();
    if (!trimmed) return null;

    const meridiemMatch = trimmed.match(/(am|pm)$/);
    const meridiem = meridiemMatch ? meridiemMatch[1] : null;
    if (meridiem) {
        trimmed = trimmed.replace(/(am|pm)$/i, '').trim();
    }

    let hoursPart = '';
    let minutesPart = '';

    if (trimmed.includes(':')) {
        const [h, m = '0'] = trimmed.split(':');
        hoursPart = h;
        minutesPart = m;
    } else if (trimmed.length > 2) {
        hoursPart = trimmed.slice(0, -2);
        minutesPart = trimmed.slice(-2);
    } else {
        hoursPart = trimmed;
        minutesPart = '0';
    }

    let hour = parseInt(hoursPart, 10);
    let minute = parseInt(minutesPart, 10);

    if (Number.isNaN(hour) || Number.isNaN(minute)) return null;

    minute = Math.min(Math.max(minute, 0), 59);

    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;

    if (!meridiem && hour <= 12 && hour < OFF_WORK_END.hour) {
        hour += 12;
    }

    return hour * 60 + minute;
};

const calculateOtHoursFromTime = (value: string): number | null => {
    const minutes = parseTimeStringToMinutes(value);
    if (minutes === null) return null;

    const diffMinutes = minutes - OFF_WORK_TOTAL_MINUTES;
    if (diffMinutes <= 0) return 0;

    return parseFloat((diffMinutes / 60).toFixed(2));
};

const DetailModal: React.FC<DetailModalProps> = ({ claimFormId, detailToEdit, isOpen, onClose, onSuccess }) => {

    const isEditMode = !!detailToEdit;
    const initialAmountRm = isEditMode ? detailToEdit.amount : 0.00;
    const initialKm = isEditMode ? detailToEdit.km : 0;
    const initialClaimTypeString = isEditMode ? getClaimTypeString(detailToEdit.claimType) : CLAIM_TYPES_STRINGS[0];

    const initialInput: ClaimDetailInput = useMemo(() => ({
        date: isEditMode
            ? detailToEdit.date || new Date().toISOString().substring(0, 10)
            : new Date().toISOString().substring(0, 10),
        company: isEditMode ? detailToEdit.company : '',
        amount: initialAmountRm,
        claimType: initialClaimTypeString,
        km: initialKm,
        otherClaimType: isEditMode ? detailToEdit.otherClaimType || '' : '',
    }), [
        isEditMode,
        detailToEdit,
        initialAmountRm,
        initialClaimTypeString,
        initialKm
    ]);

    const [input, setInput] = useState<ClaimDetailInput>(initialInput);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);

    const isMileageClaim = input.claimType === "Mileage (KM)";

    useEffect(() => {
        if (isOpen) {
            setInput(initialInput);
            setSubmissionError(null);
        }
    }, [isOpen, detailToEdit, initialInput]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'amount' || name === 'km') {
            const numValue = parseFloat(value);
            setInput(prev => ({ ...prev, [name]: isNaN(numValue) ? 0 : numValue }));
        } else if (name === 'claimType') {
            setInput(prev => ({
                ...prev,
                claimType: value,
                amount: value === "Mileage (KM)" ? 0 : prev.amount,
                km: value !== "Mileage (KM)" ? 0 : prev.km,
                otherClaimType: value !== "Other" ? '' : prev.otherClaimType,
            }));
        } else {
            setInput(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async () => {
        if (!input.company) {
            setSubmissionError("Please provide a Company / Vendor name.");
            return;
        }

        if (isMileageClaim && input.km <= 0) {
            setSubmissionError("Please enter a valid distance in KM.");
            return;
        }

        if (!isMileageClaim && input.amount <= 0) {
            setSubmissionError("Please enter a valid monetary Amount (RM).");
            return;
        }

        setIsSubmitting(true);
        setSubmissionError(null);

        try {
            let amountValue = 0;
            let kmValue = 0;

            if (isMileageClaim) {
                kmValue = input.km;
                amountValue = 0;
            } else {
                amountValue = input.amount;
                kmValue = 0;
            }

            const payload = {
                claimFormId: isEditMode ? detailToEdit?.claimFormId : claimFormId,
                date: input.date,
                company: input.company,
                amount: amountValue,
                km: kmValue,
                claimType: input.claimType,
                otherClaimType: input.claimType === "Other" ? input.otherClaimType : null,
            };

            const method = isEditMode ? 'PUT' : 'POST';
            const url = isEditMode ? `${apiBase}/api/ClaimDetails/${detailToEdit?.id}` : `${apiBase}/api/ClaimDetails`;

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                try {
                    const errorJson = JSON.parse(errorBody);
                    if (errorJson.errors) {
                        const validationMessages = Object.values(errorJson.errors).flatMap(messages => (messages as string[])).join('; ');
                        throw new Error(`Validation failed: ${validationMessages}`);
                    }
                } catch {
                    console.error("API Error Response (Text):", errorBody);
                    throw new Error(`Failed to save detail. Status: ${response.status}. See console for details.`);
                }
                throw new Error(`Failed to save detail. Status: ${response.status}. See console for details.`);
            }

            console.log(`Detail ${isEditMode ? 'updated' : 'added'} successfully.`);
            onSuccess();

        } catch (error: unknown) {
            console.error("Submission failed:", error);

            if (error instanceof Error) {
                setSubmissionError(error.message);
            } else {
                setSubmissionError("An unexpected error occurred during submission.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 p-6 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-blue-50 rounded-t-2xl">
                    <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                        {isEditMode ? (<><Edit size={20} className="text-emerald-600" />Edit Detail #{detailToEdit?.id}</>) : (<><Plus size={20} className="text-indigo-600" />Add New Detail</>)}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors rounded-full p-2 hover:bg-white" disabled={isSubmitting}>
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {submissionError && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3">
                            <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-red-700">
                                <strong className="font-semibold block mb-1">Error!</strong>
                                <span>{submissionError}</span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                <Calendar size={16} className="text-indigo-500" />
                                Date
                            </label>
                            <input type="date" name="date" value={input.date} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" required />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Claim Type</label>
                            <select name="claimType" value={input.claimType} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white transition-all" required>
                                {CLAIM_TYPES_STRINGS.map((type) => (<option key={type} value={type}>{type}</option>))}
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    {input.claimType === "Other" && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <label className="block text-sm font-medium text-amber-800 mb-2">Please specify claim type</label>
                            <input type="text" name="otherClaimType" value={input.otherClaimType} onChange={handleInputChange} placeholder="Enter custom claim type" className="w-full px-4 py-2.5 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none bg-white transition-all" required />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Company / Vendor Name</label>
                        <input type="text" name="company" value={input.company} onChange={handleInputChange} placeholder="e.g., Grab, Starbucks, Hospital" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" required />
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                            {isMileageClaim ? <MapPin size={16} className="text-amber-500" /> : <DollarSign size={16} className="text-emerald-500" />}
                            {isMileageClaim ? "Distance (KM)" : "Amount (RM)"}
                        </label>
                        <input type="number" name={isMileageClaim ? "km" : "amount"} min={isMileageClaim ? "0.1" : "0.01"} step={isMileageClaim ? "0.1" : "0.01"} value={isMileageClaim ? input.km : input.amount.toFixed(2)} onChange={handleInputChange} placeholder={isMileageClaim ? "e.g., 25.5" : "0.00"} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-right font-mono text-lg transition-all" required />
                    </div>
                </div>

                <div className="sticky bottom-0 p-6 bg-slate-50 rounded-b-2xl flex justify-end gap-3 border-t border-slate-200">
                    <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors" disabled={isSubmitting}>Cancel</button>
                    <button onClick={handleSubmit} className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm ${isEditMode ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`} disabled={isSubmitting}>
                        {isSubmitting ? (<><Loader2 size={18} className="animate-spin" />Saving...</>) : (<><Save size={18} />{isEditMode ? 'Save Changes' : 'Add Detail'}</>)}
                    </button>
                </div>
            </div>
        </div>
    );
};

const OtModal: React.FC<OTModalProps> = ({ claimId, otToEdit, isOpen, onClose, onSuccess }) => {
    const isEditMode = !!otToEdit;

    const getInitialInput = useCallback((): OTClaimInput => ({
        date: normalizeDateForInput(otToEdit?.date),
        customer: otToEdit?.customer || '',
        time: otToEdit?.time || '',
        hours: otToEdit?.hours || 0,
    }), [otToEdit]);

    const [input, setInput] = useState<OTClaimInput>(getInitialInput);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setInput(getInitialInput());
            setSubmissionError(null);
        }
    }, [isOpen, otToEdit, getInitialInput]);
    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setInput(prev => {
            if (name === 'hours') {
                return { ...prev, hours: Number.isNaN(Number(value)) ? 0 : parseFloat(value) };
            }
            if (name === 'time') {
                const computed = calculateOtHoursFromTime(value);
                return { ...prev, time: value, hours: computed !== null ? computed : prev.hours };
            }
            return { ...prev, [name]: value };
        });
    };

    const handleSubmit = async () => {
        if (!input.customer.trim()) {
            setSubmissionError("Customer is required.");
            return;
        }

        if (!input.time.trim()) {
            setSubmissionError("Time is required.");
            return;
        }

        if (input.hours <= 0) {
            setSubmissionError("Hours must be greater than zero.");
            return;
        }

        setIsSubmitting(true);
        setSubmissionError(null);

        try {
            const normalizedDate = formatDateForApi(input.date);
            const hoursValue = parseFloat((input.hours || 0).toFixed(2));
            const activeClaimId = isEditMode ? otToEdit!.claimid : claimId;

            const payload = {
                date: normalizedDate,
                Date: normalizedDate,
                customer: input.customer,
                Customer: input.customer,
                time: input.time,
                Time: input.time,
                hours: hoursValue,
                Hours: hoursValue,
                claimid: activeClaimId,
                Claimid: activeClaimId,
            };

            const method = isEditMode ? 'PUT' : 'POST';
            const url = isEditMode ? `${apiBase}/api/OTclaim/${otToEdit?.id}` : `${apiBase}/api/OTclaim`;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(errorBody || `Failed to ${isEditMode ? 'update' : 'create'} OT claim.`);
            }

            onSuccess();
        } catch (error: unknown) {
            console.error("Failed to submit OT claim:", error);
            setSubmissionError(error instanceof Error ? error.message : "Unexpected error occurred.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-300">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-2xl">
                    <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                        <Clock className="text-amber-600" size={20} />
                        {isEditMode ? `Edit OT #${otToEdit?.id}` : 'Add OT Entry'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors rounded-full p-2 hover:bg-white" disabled={isSubmitting}>
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {submissionError && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-sm text-red-700 flex items-center gap-2">
                            <AlertTriangle size={16} className="flex-shrink-0" />
                            {submissionError}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                            <Calendar size={16} className="text-amber-500" />
                            Date
                        </label>
                        <input type="date" name="date" value={input.date} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all" required />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Customer</label>
                        <input type="text" name="customer" value={input.customer} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all" placeholder="Customer name" required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                <Clock size={16} className="text-amber-500" />
                                Time Range
                            </label>
                            <input type="text" name="time" value={input.time} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all" placeholder="e.g., 7:00 PM - 11:00 PM" required />
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <label className="block text-xs font-medium text-amber-700 mb-2">Calculated Hours</label>
                            <div className="text-2xl font-bold text-amber-900">{input.hours.toFixed(2)}h</div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-b-2xl flex justify-end gap-3 border-t border-slate-200">
                    <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors" disabled={isSubmitting}>Cancel</button>
                    <button onClick={handleSubmit} className="px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 bg-amber-600 hover:bg-amber-700 shadow-sm" disabled={isSubmitting}>
                        {isSubmitting ? (<><Loader2 size={18} className="animate-spin" />Saving...</>) : (<><Save size={18} />{isEditMode ? 'Save Changes' : 'Add OT'}</>)}
                    </button>
                </div>
            </div>
        </div>
    );
};

// API Functions
const fetchClaimById = async (claimId: number | null): Promise<ClaimFormApi | null> => {
    if (claimId === null || isNaN(claimId)) return null;
    try {
        const url = `${apiBase}/api/Claims/${claimId}`;
        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 404) {
                console.warn(`Claim with ID ${claimId} not found on server.`);
                return null;
            }
            throw new Error(`Failed to fetch claim data. Status: ${response.status}`);
        }
        const data: ClaimFormApi = await response.json();
        return data;
    } catch (error) {
        console.error(`Error in fetchClaimById for ID ${claimId}:`, error);
        throw error;
    }
};

const fetchClaimDetailsByClaimId = async (claimId: number): Promise<ClaimDetailApi[]> => {
    try {
        const url = `${apiBase}/api/ClaimDetails/ByClaim/${claimId}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch claim details. Status: ${response.status}`);
        const data: ClaimDetailApi[] = await response.json();
        return data.map((detail, index) => ({
            ...detail,
            date: detail.date || new Date(Date.now() - index * 86400000).toISOString().substring(0, 10),
            km: detail.km || 0,
        }));
    } catch (error) {
        console.error(`Error fetching claim details for ID ${claimId}:`, error);
        return [];
    }
};

const fetchOtClaimsByClaimId = async (claimId: number): Promise<OTClaimApi[]> => {
    try {
        const response = await fetch(`${apiBase}/api/OTclaim`);
        if (!response.ok) throw new Error(`Failed to fetch OT claims. Status: ${response.status}`);
        const data: OTClaimApi[] = await response.json();
        return data.filter(claim => claim.claimid === claimId);
    } catch (error) {
        console.error(`Error fetching OT claims for claimId ${claimId}:`, error);
        return [];
    }
};

const deleteOtClaim = async (otId: number): Promise<boolean> => {
    try {
        const response = await fetch(`${apiBase}/api/OTclaim/${otId}`, { method: 'DELETE' });
        if (response.status === 204) return true;
        if (response.status === 404) {
            console.warn(`OT claim ${otId} not found.`);
            return true;
        }
        throw new Error(`Failed to delete OT claim. Status: ${response.status}`);
    } catch (error) {
        console.error(`Error deleting OT claim ${otId}:`, error);
        return false;
    }
};

const deleteClaimDetail = async (detailId: number): Promise<boolean> => {
    console.log("Attempting to delete claim detail:", detailId);
    try {
        const url = `${apiBase}/api/ClaimDetails/${detailId}`;
        const response = await fetch(url, { method: 'DELETE' });
        if (response.status === 204) {
            console.log(`Detail ${detailId} deleted successfully.`);
            return true;
        } else if (response.status === 404) {
            console.warn(`Detail ${detailId} not found.`);
            return true;
        } else {
            throw new Error(`Failed to delete detail. Status: ${response.status}`);
        }
    } catch (error) {
        console.error(`Error deleting claim detail ${detailId}:`, error);
        return false;
    }
};

const EditClaimPage: React.FC = () => {
    const { user } = useAuth();
    const [claimId, setClaimId] = useState<number | null>(null);
    const [claim, setClaim] = useState<ClaimFormApi | null>(null);
    const [claimDetails, setClaimDetails] = useState<ClaimDetailApi[]>([]);
    const [otClaims, setOtClaims] = useState<OTClaimApi[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isOtModalOpen, setIsOtModalOpen] = useState(false);
    const [editingDetail, setEditingDetail] = useState<ClaimDetailApi | null>(null);
    const [editingOtClaim, setEditingOtClaim] = useState<OTClaimApi | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const monetaryClaims = claimDetails.filter(d => d.claimType !== 8);
    const mileageClaims = claimDetails.filter(d => d.claimType === 8);


    const totalAmount = useMemo(() => {
        return claimDetails.reduce((sum, detail) => {
            return detail.claimType !== 8 ? sum + detail.amount : sum;
        }, 0);
    }, [claimDetails]);

    const totalKm = useMemo(() => {
        return mileageClaims.reduce((sum, detail) => sum + detail.km, 0);
    }, [mileageClaims]);
    interface MileageDetails {
        id: number;
        incentive: number;
        subs_KM: number;
        first_KM: number;
    }

    const [mileageDetails, setMileageDetails] = useState<MileageDetails | null>(null);

    useEffect(() => {
        fetch(`${apiBase}/api/MileagueDetails/1`)
            .then((res) => res.json())
            .then((data: MileageDetails) => setMileageDetails(data))
            .catch((err) => console.error("Error fetching mileage details:", err));
    }, []);

    const mileagePricing = useMemo(() => {
        if (!mileageDetails) return { additionalKm: 0, additionalPrice: 0, totalPrice: 0 };

        const baseKm = mileageDetails.first_KM;
        const basePrice = mileageDetails.incentive;
        const additionalRate = mileageDetails.subs_KM;

        const additionalKm = Math.max(totalKm - baseKm, 0);
        const additionalPrice = additionalKm * additionalRate;
        const totalPrice = basePrice + additionalPrice;

        return { additionalKm, additionalPrice, totalPrice };
    }, [totalKm, mileageDetails]);

    const totalOtHours = useMemo(() => {
        return otClaims.reduce((sum, claim) => sum + claim.hours, 0);
    }, [otClaims]);

    const handleRefresh = () => {
        setIsAddModalOpen(false);
        setEditingDetail(null);
        setIsOtModalOpen(false);
        setEditingOtClaim(null);
        setRefreshTrigger(prev => prev + 1);
    };

    const handleDeleteDetail = async (detailId: number) => {
        if (window.confirm("Are you sure you want to permanently delete this claim detail?")) {
            const success = await deleteClaimDetail(detailId);
            if (success) {
                console.log(`Claim detail #${detailId} deleted successfully!`);
                handleRefresh();
            }
        }
    };

    const handleEditDetail = (detail: ClaimDetailApi) => {
        setEditingDetail(detail);
    };

    const handleDeleteOtClaim = async (otId: number) => {
        if (window.confirm("Are you sure you want to delete this OT record?")) {
            const success = await deleteOtClaim(otId);
            if (success) {
                handleRefresh();
            }
        }
    };

    const handleEditOtClaim = (otClaim: OTClaimApi) => {
        setEditingOtClaim(otClaim);
    };

    const uploadAttachment = async (id: number, file: File) => {
        if (!claimId) return;

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${apiBase}/api/ClaimDetails/${id}/Attach`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");

        // fetch updated claim details
        const updatedDetails = await fetchClaimDetailsByClaimId(claimId);

        // update state so UI refreshes immediately
        setClaimDetails(updatedDetails);

        alert("Attachment uploaded successfully!");
    };


    const previewAttachment = async (id: number) => {
        try {
            const newTab = window.open("", "_blank");
            if (!newTab) {
                alert("Please allow pop-ups in your browser to view attachments.");
                return;
            }
            const response = await fetch(`${apiBase}/api/ClaimDetails/${id}/Attach`);
            const contentType = response.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
                const json = await response.json();
                newTab.close();
                alert(json.message || "No attachment found.");
                return;
            }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            newTab.location.href = url;
            setTimeout(() => URL.revokeObjectURL(url), 5000);
        } catch (error) {
            console.error("Attachment preview failed:", error);
            alert("Error opening attachment.");
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const idParam = params.get('id');
            const parsedId = idParam ? parseInt(idParam, 10) : null;
            if (parsedId !== null && !isNaN(parsedId)) {
                setClaimId(parsedId);
            } else {
                setError("Error: Claim ID is missing or invalid in the URL.");
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        if (claimId !== null) {
            const loadData = async () => {
                setIsLoading(true);
                let claimHeader: ClaimFormApi | null = null;
                try {
                    claimHeader = await fetchClaimById(claimId);
                    if (claimHeader) {
                        setClaim(claimHeader);
                    } else {
                        setError(`Claim with ID ${claimId} not found.`);
                        setIsLoading(false);
                        return;
                    }
                    const [details, otData] = await Promise.all([
                        fetchClaimDetailsByClaimId(claimId),
                        fetchOtClaimsByClaimId(claimId),
                    ]);
                    setClaimDetails(details);
                    setOtClaims(otData);
                } catch (err) {
                    console.error("Fetch Error caught by component:", err);
                    setError("Failed to load claim data. Please check the network connection and server status.");
                } finally {
                    setIsLoading(false);
                }
            };
            loadData();
        }
    }, [claimId, refreshTrigger]);



    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                <Loader2 size={48} className="animate-spin text-indigo-500 mb-4" />
                <p className="text-xl text-slate-600">Loading Claim{claimId ? ` #${claimId}` : '...'}</p>
            </div>
        );
    }

    if (error || !claim) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-8 shadow-lg">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                <AlertTriangle className="text-red-500" size={24} />
                            </div>
                            <h2 className="text-2xl font-semibold text-red-800">Error Loading Claim</h2>
                        </div>
                        <p className="text-red-700 mb-6">{error || "Claim data could not be retrieved."}</p>
                        <a href="/ClaimForm" className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm">
                            <ArrowLeft size={18} />
                            Back to Claims List
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    const STATUS_COLORS: { [key: string]: { bg: string; text: string; icon: string } } = {
        WAITING: { bg: 'bg-amber-100', text: 'text-amber-800', icon: 'text-amber-500' },
        PENDING: { bg: 'bg-blue-100', text: 'text-blue-800', icon: 'text-blue-500' },
        APPROVED: { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: 'text-emerald-500' },
        REJECTED: { bg: 'bg-red-100', text: 'text-red-800', icon: 'text-red-500' },
    };
    const colors = STATUS_COLORS[claim.condition] || { bg: 'bg-gray-100', text: 'text-gray-600', icon: 'text-gray-400' };

    return (
        <ProtectedRoute>
            <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="bg-white shadow-lg rounded-2xl p-6 border-l-4 border-indigo-500">
                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <FileText className="text-white" size={28} />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold text-slate-800">Claim Form #{claim.id}</h1>
                                        <p className="text-slate-500 text-sm mt-1">Detailed view and management</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                                        <Calendar className="text-emerald-600" size={20} />
                                        <div>
                                            <p className="text-xs text-emerald-600 font-medium">Period</p>
                                            <p className="text-sm font-bold text-emerald-900">{claim.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                        <Receipt className="text-blue-600" size={20} />
                                        <div>
                                            <p className="text-xs text-blue-600 font-medium">Staff</p>
                                            <p className="text-sm font-bold text-blue-900">{claim.staff}</p>
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${colors.bg} border-${claim.condition === 'WAITING' ? 'amber' : claim.condition === 'APPROVED' ? 'emerald' : 'slate'}-200`}>
                                        <Clock className={colors.icon} size={20} />
                                        <div>
                                            <p className={`text-xs font-medium ${colors.text}`}>Status</p>
                                            <p className={`text-sm font-bold ${colors.text}`}>{claim.condition}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <a href="/ClaimForm" className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all shadow-sm font-medium whitespace-nowrap">
                                <ArrowLeft size={18} />
                                Back to List
                            </a>
                        </div>
                    </div>

                    {/* OT Claims Section */}
                    {user?.department === "Technician" && (

                        <div className="bg-white shadow-lg rounded-2xl p-6 border-l-4 border-amber-500">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                        <Clock className="text-amber-600" size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-semibold text-slate-800">Overtime Claims</h2>
                                        <p className="text-sm text-slate-500">{otClaims.length} record(s)</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsOtModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all shadow-sm font-medium">
                                    <Plus size={18} />
                                    Add OT
                                </button>
                            </div>
                            {otClaims.length === 0 ? (
                                <div className="text-center py-12 bg-amber-50 rounded-xl border-2 border-dashed border-amber-200">
                                    <Clock className="mx-auto text-amber-300 mb-3" size={48} />
                                    <p className="text-amber-700 font-medium">No OT claims recorded</p>
                                    <p className="text-sm text-amber-600 mt-1">Click &quot;Add OT&quot; to create your first entry</p>
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                                        <table className="min-w-full divide-y divide-slate-200">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">ID</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Customer</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Time</th>
                                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Hours</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-slate-100">
                                                {otClaims.map(ot => (
                                                    <tr key={ot.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-4 py-3 text-sm font-medium text-slate-900">#{ot.id}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-600">{ot.date}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-800">{ot.customer}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-600">{ot.time}</td>
                                                        <td className="px-4 py-3 text-right"><span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">{ot.hours}h</span></td>
                                                        <td className="px-4 py-3"><div className="flex justify-center gap-2">
                                                            <button onClick={() => handleEditOtClaim(ot)} className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit"><Edit size={16} /></button>
                                                            <button onClick={() => handleDeleteOtClaim(ot.id)} className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete"><Trash2 size={16} /></button>
                                                        </div></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 min-w-[200px]">
                                            <p className="text-sm text-amber-700 font-medium mb-1">Total OT Hours</p>
                                            <p className="text-3xl font-bold text-amber-900">{totalOtHours.toFixed(2)}h</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Claim Details Section */}
                    <div className="bg-white shadow-lg rounded-2xl p-6 border-l-4 border-emerald-500">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                    <Receipt className="text-emerald-600" size={20} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold text-slate-800">Expense Details</h2>
                                    <p className="text-sm text-slate-500">{claimDetails.length} item(s)</p>
                                </div>
                            </div>
                            <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-sm font-medium">
                                <Plus size={18} />
                                Add Detail
                            </button>
                        </div>

                        {claimDetails.length === 0 ? (
                            <div className="text-center py-12 bg-blue-50 rounded-xl border-2 border-dashed border-blue-200">
                                <FileText className="mx-auto text-blue-300 mb-3" size={48} />
                                <p className="text-blue-700 font-medium">No expense details found</p>
                                <p className="text-sm text-blue-600 mt-1">Click &quot;Add Detail&quot; to begin logging expenses</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Monetary Claims */}
                                {monetaryClaims.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                            <DollarSign className="text-emerald-600" size={20} />
                                            Monetary Claims ({monetaryClaims.length})
                                        </h3>
                                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                                            <table className="min-w-full divide-y divide-slate-200">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">ID</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Company</th>
                                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Amount</th>
                                                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-slate-100">
                                                    {monetaryClaims.map(detail => (
                                                        <tr key={detail.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-4 py-3 text-sm font-medium text-slate-900">#{detail.id}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-600">{detail.date}</td>
                                                            <td className="px-4 py-3"><span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{getClaimTypeString(detail.claimType)}</span></td>
                                                            <td className="px-4 py-3 text-sm text-slate-800">{detail.company}</td>
                                                            <td className="px-4 py-3 text-right text-sm font-bold text-emerald-700">RM {detail.amount.toFixed(2)}</td>
                                                            <td className="px-4 py-3"><div className="flex justify-center gap-1">
                                                                <label
                                                                    htmlFor={`file-${detail.id}`}
                                                                    className="relative p-2 cursor-pointer text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                                    title="Attach"
                                                                >
                                                                    <Paperclip size={16} />

                                                                    {(detail.claimType !== 8 && !detail.attach) && (
                                                                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
                                                                    )}
                                                                </label>

                                                                <input
                                                                    id={`file-${detail.id}`}
                                                                    type="file"
                                                                    accept=".png,.jpg,.jpeg,.pdf"
                                                                    className="hidden"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) uploadAttachment(detail.id, file);
                                                                    }}
                                                                />
                                                                <button onClick={() => previewAttachment(detail.id)} className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="View"><Eye size={16} /></button>
                                                                <button onClick={() => handleEditDetail(detail)} className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit"><Edit size={16} /></button>
                                                                <button onClick={() => handleDeleteDetail(detail.id)} className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete"><Trash2 size={16} /></button>
                                                            </div></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Mileage Claims */}
                                {mileageClaims.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                            <MapPin className="text-amber-600" size={20} />
                                            Mileage Claims ({mileageClaims.length})
                                        </h3>
                                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                                            <table className="min-w-full divide-y divide-slate-200">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">ID</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Company</th>
                                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Distance</th>
                                                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-slate-100">
                                                    {mileageClaims.map(detail => (
                                                        <tr key={detail.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-4 py-3 text-sm font-medium text-slate-900">#{detail.id}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-600">{detail.date}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-800">{detail.company}</td>
                                                            <td className="px-4 py-3 text-right"><span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">{detail.km} KM</span></td>
                                                            <td className="px-4 py-3"><div className="flex justify-center gap-2">
                                                                <button onClick={() => handleEditDetail(detail)} className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit"><Edit size={16} /></button>
                                                                <button onClick={() => handleDeleteDetail(detail.id)} className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete"><Trash2 size={16} /></button>
                                                            </div></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-200">
                                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border-2 border-emerald-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-emerald-700 font-semibold mb-1">Total Monetary</p>
                                                <p className="text-4xl font-bold text-emerald-900">RM {totalAmount.toFixed(2)}</p>
                                                <p className="text-xs text-emerald-600 mt-2">From {monetaryClaims.length} claim(s)</p>
                                            </div>
                                            <div className="w-16 h-16 bg-emerald-200 rounded-xl flex items-center justify-center">
                                                <DollarSign className="text-emerald-700" size={32} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-amber-200/70 transition duration-300 hover:shadow-xl">
                                        <div className="flex items-start justify-between mb-4 border-b pb-3 border-amber-100">
                                            <div>
                                                <p className="text-xs uppercase tracking-widest text-amber-600 font-medium">Mileage Summary</p>
                                                <p className="text-3xl font-extrabold text-gray-900 mt-1">
                                                    RM {mileagePricing.totalPrice.toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="w-14 h-14 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <MapPin className="text-amber-600" size={28} />
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <p className="text-sm font-semibold text-gray-700 mb-1">Total Mileage Claimed</p>
                                            <div className="flex items-center justify-between">
                                                <p className="text-3xl font-bold text-amber-800">{totalKm} KM</p>
                                                <p className="text-sm text-gray-500">
                                                    From {mileageClaims.length} claim(s)
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-amber-50/70 p-4 rounded-lg">
                                            <p className="text-sm font-semibold text-gray-700 mb-2 border-b border-amber-200 pb-1">Calculation Breakdown</p>

                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between items-center text-gray-600">
                                                    <span className="text-xs">Petrol First 1000km:</span>
                                                    <span className="font-medium text-right">RM 500.00</span>
                                                </div>

                                                <div className="flex justify-between items-center text-gray-600">
                                                    <p className="text-xs">Subsequent 1 km × RM 0.40 : </p>
                                                    <span className="font-medium text-right">
                                                        {mileagePricing.additionalKm} km - RM {mileagePricing.additionalPrice.toFixed(2)}
                                                    </span>
                                                </div>

                                                <div className="pt-2 mt-2 border-t border-amber-200 flex justify-between items-center text-lg font-bold">
                                                    <span>TOTAL REIMBURSEMENT:</span>
                                                    <span className="text-amber-700">RM {mileagePricing.totalPrice.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modals */}
                <DetailModal claimFormId={claim.id} isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={handleRefresh} />
                {editingDetail && (<DetailModal detailToEdit={editingDetail} isOpen={!!editingDetail} onClose={() => setEditingDetail(null)} onSuccess={handleRefresh} />)}
                <OtModal claimId={claim.id} isOpen={isOtModalOpen} onClose={() => setIsOtModalOpen(false)} onSuccess={handleRefresh} />
                {editingOtClaim && (<OtModal claimId={claim.id} otToEdit={editingOtClaim} isOpen={!!editingOtClaim} onClose={() => setEditingOtClaim(null)} onSuccess={handleRefresh} />)}
            </main>
        </ProtectedRoute>
    );
};

export default EditClaimPage;