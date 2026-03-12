"use client";

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from "@/context/AuthContext";
import React from 'react';
import { useToast } from '@/components/ToastProvider';

// --- Interfaces for TypeScript ---
interface User {
    name?: string;
    position?: string;
    department?: string;
}

interface PRSFormData {
    id: number;
    name: string;
    position: string;
    department: string;
    reviewPeriod: string;
    reviewer: string;
    kpi1: string;
    kpi2: string;
    kpi3: string;
    kpi4: string;
    kpi5: string;
    kpi6: string;
    kpi7: string;
    kpi8: string;
    kpi9: string;
    kpi10: string;
    kpi11: string;
    strength: string;
    improvement: string;
    well: string;
    challenges: string;
    support: string;
    goal1: string;
    target1: string;
    goal2: string;
    target2: string;
    goal3: string;
    target3: string;
    rating: string;
    empComment: string;
    reviewerComment: string;
    empSign: string;
    empSignDate: string;
    reviewerSign: string;
    reviewerSignDate: string;
    status: "Waiting" | "Pending"; // NEW
    disabled?: boolean; // <-- add this
}

interface PerformanceReviewFormProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    existingPrs: PRSFormData | null;
    onSaved: (data: PRSFormData) => void;
    apiBaseUrl: string;
    disabled?: boolean; // <-- add this
}

const EMPTY_PRS: PRSFormData = {
    id: 0,
    name: "",
    position: "",
    department: "",
    reviewPeriod: "",
    reviewer: "",
    kpi1: "",
    kpi2: "",
    kpi3: "",
    kpi4: "",
    kpi5: "",
    kpi6: "",
    kpi7: "",
    kpi8: "",
    kpi9: "",
    kpi10: "",
    kpi11: "",
    strength: "",
    improvement: "",
    well: "",
    challenges: "",
    support: "",
    goal1: "",
    target1: "",
    goal2: "",
    target2: "",
    goal3: "",
    target3: "",
    rating: "",
    empComment: "",
    reviewerComment: "",
    empSign: "",
    empSignDate: "",
    reviewerSign: "",
    reviewerSignDate: "",
    status: "Waiting", // NEW

};

// --- 1. New Rating Select Component (1-5) ---
interface RatingSelectProps {
    label: string;
    currentValue: number | null;
    onChange: (value: number) => void;
    disabled?: boolean; // <-- add this
}
interface FormTextareaProps {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder: string;
    rows?: number;
    disabled?: boolean; // <-- add this
}
const FormTextarea = ({ label, value, onChange, placeholder, rows = 4 }: FormTextareaProps) => (
    <div style={{ display: "flex", flexDirection: "column" }}>
        <label
            style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#1f2937",
                marginBottom: "4px"
            }}
        >
            {label}
        </label>
        <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            style={{
                fontSize: "14px",
                color: "#1f2937",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                backgroundColor: "white",
                resize: "vertical"
            }}
        />
    </div>
);
const RatingSelect = ({ label, currentValue, onChange }: RatingSelectProps) => {
    const ratingOptions = [1, 2, 3, 4, 5];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "14px", fontWeight: 600, color: "#1f2937" }}>
                {label}
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>Low (1)</span>
                {ratingOptions.map((value) => (
                    <button
                        key={value}
                        onClick={() => onChange(value)}
                        style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            border: `2px solid ${currentValue === value ? '#111827' : '#d1d5db'}`,
                            background: currentValue === value ? '#111827' : 'white',
                            color: currentValue === value ? 'white' : '#1f2937',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease-in-out',
                            flexShrink: 0,
                            boxShadow: currentValue === value ? '0 0 0 2px rgba(17, 24, 39, 0.1)' : 'none',
                        }}
                        aria-label={`Select rating ${value} for ${label}`}
                    >
                        {value}
                    </button>
                ))}
                <span style={{ fontSize: "12px", color: "#6b7280" }}>High (5)</span>
            </div>
        </div>
    );
};
interface OverallRatingSelectProps {
    label: string;
    currentValue: string | null;
    onChange: (value: string) => void;
    disabled?: boolean; // <-- add this

}
const OverallRatingSelect = ({ label, currentValue, onChange }: OverallRatingSelectProps) => { // Use the new interface
    const ratingOptions = ["Excellent", "Good", "Satisfactory", "Needs Improvement", "Poor"];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "14px", fontWeight: 600, color: "#1f2937" }}>
                {label}
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {ratingOptions.map((value, ) => (
                    <button
                        key={value}
                        onClick={() => onChange(value)}
                        style={{
                            width: "120px", // Increased width to fit the string label
                            height: "42px",
                            borderRadius: "6px", // Changed to rounded rectangle
                            border: `2px solid ${currentValue === value ? '#111827' : '#d1d5db'}`,
                            background: currentValue === value ? '#111827' : 'white',
                            color: currentValue === value ? 'white' : '#1f2937',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease-in-out',
                            flexShrink: 0,
                            boxShadow: currentValue === value ? '0 0 0 2px rgba(17, 24, 39, 0.1)' : 'none',
                        }}
                        aria-label={`Select rating ${value} for ${label}`}
                    >
                        {value} {/* Display the string value */}
                    </button>
                ))}
            </div>
        </div>
    );
};
// --- Helper Component for Non-Editable Info Rows ---
const FormInfoRow = ({ label, value }: { label: string, value: string }) => (
    <div style={{ display: "flex", flexDirection: "column" }}>
        <label style={{ fontSize: "12px", fontWeight: 500, color: "#4b5563", marginBottom: "4px" }}>
            {label} :
        </label>
        <p style={{ fontSize: "14px", color: "#1f2937", padding: "8px 12px", background: "#f9fafb", borderRadius: "6px" }}>
            {value}
        </p>
    </div>
);

interface GoalTargetInputFieldProps {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; // changed from HTMLInputElement
    placeholder?: string;
    width?: string;
    rows?: number;
}

const GoalTargetInputField = ({
    label,
    value,
    onChange,
    placeholder,
    width = "100%",
    rows = 4, // default 4 rows
}: GoalTargetInputFieldProps) => (
    <div style={{ display: "flex", flexDirection: "column", width: width }}>
        <label
            style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#1f2937",
                marginBottom: "4px",
                marginLeft:"8px"
            }}
        >
            {label}
        </label>
        <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            style={{
                fontSize: "14px",
                color: "#1f2937",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                backgroundColor: "white",
                resize: "vertical", // allows user to resize vertically
                minHeight: `${rows * 24}px`, // optional: base height
            }}
        />
    </div>
);
// --- Main Modal Component: PerformanceReviewForm ---
function PerformanceReviewForm({ isOpen, onClose, user, existingPrs, onSaved, apiBaseUrl }: PerformanceReviewFormProps) {
    const addToast = useToast();
    const employeeName = existingPrs?.name || user?.name || "N/A";
    const employeePosition = existingPrs?.position || user?.position || "N/A";
    const employeeDepartment = existingPrs?.department || user?.department || "N/A";
    const reviewerName = existingPrs?.reviewer || "N/A";
    const reviewerSign = existingPrs?.reviewerSign || "N/A";
    const reviewerSignDate = existingPrs?.reviewerSignDate || "N/A";
    const staticFormData = {
        name: employeeName,
        position: employeePosition,
        department: employeeDepartment,
    };

    // State for the Review Period input
    const [reviewPeriod, setReviewPeriod] = useState<string>("");
    // State for the new KPI ratings (1-6)
    const [kpi1Rating, setKpi1Rating] = useState<number | null>(null); // Quality of Work
    const [kpi2Rating, setKpi2Rating] = useState<number | null>(null); // Productivity / Output
    const [kpi3Rating, setKpi3Rating] = useState<number | null>(null); // Attendance & Punctuality
    const [kpi4Rating, setKpi4Rating] = useState<number | null>(null); // Meeting Deadlines
    const [kpi5Rating, setKpi5Rating] = useState<number | null>(null); // Knowledge & Skills
    const [kpi6Rating, setKpi6Rating] = useState<number | null>(null); // Compliance / SOP Adherence
    const [kpi7Rating, setKpi7Rating] = useState<number | null>(null); // Responsibility & Ownership
    const [kpi8Rating, setKpi8Rating] = useState<number | null>(null); // Teamwork & Cooperation
    const [kpi9Rating, setKpi9Rating] = useState<number | null>(null); // Communication
    const [kpi10Rating, setKpi10Rating] = useState<number | null>(null); // Initaitive & Problem-Solving
    const [kpi11Rating, setKpi11Rating] = useState<number | null>(null); // Custoimer Service
    const [strengthRemarks, setStrengthRemarks] = useState<string>("");
    const [improvement, setImprovement] = useState<string>("");
    const [well, setWell] = useState<string>("");
    const [challenges, setChallenges] = useState<string>("");
    const [support, setSupport] = useState<string>("");

    // State for Goals and Targets (User's request)
    const [goal1, setGoal1] = useState<string>("");
    const [target1, setTarget1] = useState<string>("");
    const [goal2, setGoal2] = useState<string>("");
    const [target2, setTarget2] = useState<string>("");
    const [goal3, setGoal3] = useState<string>("");
    const [target3, setTarget3] = useState<string>("");
    const [overallRating, setOverallRating] = useState<string | null>(null);
    const [employeecomment, setEmployeecomment] = useState<string>("");
    const [employeeSignature, setEmployeeSignature] = useState<string>("");
    const [employeeSignDate, setEmployeeSignDate] = useState<string>("");

    const [isSaving, setIsSaving] = useState(false);
    const [, setSubmitError] = useState<string | null>(null);
    const [, setSubmitMessage] = useState<string | null>(null);
    const isPending = existingPrs?.status === "Pending";

    const toNumberOrNull = (value?: string | null) => {
        if (!value) return null;
        const parsed = Number(value);
        return Number.isNaN(parsed) ? null : parsed;
    };

    useEffect(() => {
        if (!isOpen) return;
        setReviewPeriod(existingPrs?.reviewPeriod ?? "");
        setKpi1Rating(toNumberOrNull(existingPrs?.kpi1));
        setKpi2Rating(toNumberOrNull(existingPrs?.kpi2));
        setKpi3Rating(toNumberOrNull(existingPrs?.kpi3));
        setKpi4Rating(toNumberOrNull(existingPrs?.kpi4));
        setKpi5Rating(toNumberOrNull(existingPrs?.kpi5));
        setKpi6Rating(toNumberOrNull(existingPrs?.kpi6));
        setKpi7Rating(toNumberOrNull(existingPrs?.kpi7));
        setKpi8Rating(toNumberOrNull(existingPrs?.kpi8));
        setKpi9Rating(toNumberOrNull(existingPrs?.kpi9));
        setKpi10Rating(toNumberOrNull(existingPrs?.kpi10));
        setKpi11Rating(toNumberOrNull(existingPrs?.kpi11));
        setStrengthRemarks(existingPrs?.strength ?? "");
        setImprovement(existingPrs?.improvement ?? "");
        setWell(existingPrs?.well ?? "");
        setChallenges(existingPrs?.challenges ?? "");
        setSupport(existingPrs?.support ?? "");
        setGoal1(existingPrs?.goal1 ?? "");
        setTarget1(existingPrs?.target1 ?? "");
        setGoal2(existingPrs?.goal2 ?? "");
        setTarget2(existingPrs?.target2 ?? "");
        setGoal3(existingPrs?.goal3 ?? "");
        setTarget3(existingPrs?.target3 ?? "");
        setOverallRating(existingPrs?.rating ?? null);
        setEmployeecomment(existingPrs?.empComment ?? "");
        const defaultSignature = existingPrs?.empSign ?? user?.name ?? "";
        const defaultSignDate =
            existingPrs?.empSignDate ??
            new Date().toISOString().split("T")[0];
        setEmployeeSignature(defaultSignature);
        setEmployeeSignDate(defaultSignDate);
        setSubmitError(null);
        setSubmitMessage(null);
    }, [existingPrs, isOpen, user?.name]);


    if (!isOpen) {
        return null;
    }

    return (
        // Modal Overlay
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "24px",
                overflowY: "auto",
            }}
        >
            {/* Modal Content */}
            <div
                style={{
                    background: "white",
                    borderRadius: "16px",
                    width: "100%",
                    maxWidth: "800px", // Increased max width for better rating display
                    maxHeight: "90vh",
                    overflowY: "auto",
                    boxShadow: "0 10px 20px rgba(0,0,0,0.15)",
                }}
            >
                {/* Modal Header */}
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>Performance Review Sheet</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            fontSize: "24px",
                            cursor: "pointer",
                            color: "#9ca3af"
                        }}
                        aria-label="Close form"
                    >
                        &times;
                    </button>
                </div>

                {/* Form Body */}
                <div style={{ padding: "24px" }}>

                    {/* --- 1. Section: Employee Information --- */}
                    <div style={{ marginBottom: "32px", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid #f3f4f6" }}>
                            Employee Information
                        </h3>

                        {/* Information Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
                            {/* Static Fields */}
                            <FormInfoRow label="Name" value={staticFormData.name} />
                            <FormInfoRow label="Position" value={staticFormData.position} />
                            <FormInfoRow label="Department" value={staticFormData.department} />
                            <FormInfoRow label="Reviewer" value={reviewerName} />

                            {/* Input Field for Review Period */}
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <label
                                    style={{
                                        fontSize: "12px",
                                        fontWeight: 500,
                                        color: "#4b5563",
                                        marginBottom: 4
                                    }}
                                >
                                    Review Period :
                                </label>

                                <input
                                    disabled={isPending}
                                    type="text"
                                    value={reviewPeriod ?? ""}
                                    onChange={(e) => setReviewPeriod(e.target.value)}
                                    placeholder="e.g., 2025"
                                    style={{
                                        fontSize: "14px",
                                        color: "#1f2937",
                                        padding: "8px 12px",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "6px",
                                        backgroundColor: "white"
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* --- 2. Section: Key Performance Indicators --- */}
                    <div style={{ marginBottom: "32px", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid #f3f4f6" }}>
                            1. Key Performance Indicators (KPIs)
                        </h3>
                        <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "20px" }}>
                            Rate your performance from 1 (Needs Improvement) to 5 (Exceptional).
                        </p>

                        {/* KPI Rating Grid */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <RatingSelect disabled={isPending} label="1. Quality of Work" currentValue={kpi1Rating} onChange={setKpi1Rating} />
                            <RatingSelect disabled={isPending} label="2. Productivity / Output" currentValue={kpi2Rating} onChange={setKpi2Rating} />
                            <RatingSelect disabled={isPending} label="3. Attendance & Punctuality" currentValue={kpi3Rating} onChange={setKpi3Rating} />
                            <RatingSelect disabled={isPending} label="4. Meeting Deadlines" currentValue={kpi4Rating} onChange={setKpi4Rating} />
                            <RatingSelect disabled={isPending} label="5. Knowledge & Skills" currentValue={kpi5Rating} onChange={setKpi5Rating} />
                            <RatingSelect disabled={isPending} label="6. Compliance / SOP Adherence" currentValue={kpi6Rating} onChange={setKpi6Rating} />
                        </div>
                    </div>

                    {/* --- 3. Section: Behaviour & Attitude (1-5) --- */}
                    <div style={{ marginBottom: "32px", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid #f3f4f6" }}>
                            2. Behaviour & Attitude (1-5):
                        </h3>
                        <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "20px" }}>
                            Rate your performance from 1 (Needs Improvement) to 5 (Exceptional).
                        </p>

                        {/* Behaviour Rating Grid */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <RatingSelect disabled={isPending} label="1. Responsibility & Ownership" currentValue={kpi7Rating} onChange={setKpi7Rating} />
                            <RatingSelect disabled={isPending} label="2. Teamwork & Cooperation" currentValue={kpi8Rating} onChange={setKpi8Rating} />
                            <RatingSelect disabled={isPending} label="3. Communication" currentValue={kpi9Rating} onChange={setKpi9Rating} />
                            <RatingSelect disabled={isPending} label="4. Initiative & Ownership" currentValue={kpi10Rating} onChange={setKpi10Rating} />
                            <RatingSelect disabled={isPending} label="5. Customer Service" currentValue={kpi11Rating} onChange={setKpi11Rating} />
                        </div>
                    </div>

                    {/* --- 4. Section: Strengths (Textarea Input) --- */}
                    <div style={{ marginBottom: "32px", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid #f3f4f6" }}>
                            3. Strengths:
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <FormTextarea
                                disabled={isPending}
                                label=""
                                value={strengthRemarks}
                                onChange={(e) => setStrengthRemarks(e.target.value)}
                                placeholder="E.g., Exceptional problem-solving skills, highly reliable, strong attention to detail."
                                rows={6}
                            />
                        </div>
                    </div>

                    {/* --- 5. Section: Areas for Improvement (Textarea Input) --- */}
                    <div style={{ marginBottom: "32px", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid #f3f4f6" }}>
                            4. Areas for Improvement:
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <FormTextarea
                                disabled={isPending}
                                label=""
                                value={improvement}
                                onChange={(e) => setImprovement(e.target.value)}
                                placeholder="E.g., Need to develop strategic planning skills, improve time management on complex tasks."
                                rows={6}
                            />
                        </div>
                    </div>

                    {/* --- 6. Section: Employee Self-Review --- */}
                    <div style={{ marginBottom: "32px", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid #f3f4f6" }}>
                            5. Employee Self-Review:
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <FormTextarea
                                disabled={isPending}
                                label="What went well?"
                                value={well}
                                onChange={(e) => setWell(e.target.value)}
                                placeholder="Key accomplishments and successes."
                                rows={2}
                            />
                            <FormTextarea
                                disabled={isPending}
                                label="Challenges faced?"
                                value={challenges}
                                onChange={(e) => setChallenges(e.target.value)}
                                placeholder="Obstacles and difficulties encountered."
                                rows={2}
                            />
                            <FormTextarea
                                disabled={isPending}
                                label="Support needed?"
                                value={support}
                                onChange={(e) => setSupport(e.target.value)}
                                placeholder="Resources, training, or support required from management."
                                rows={2}
                            />
                        </div>
                    </div>

                    {/* --- 7. Section: Goals for Next Review Period (User's request) --- */}
                    <div style={{ marginBottom: "32px", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid #f3f4f6" }}>
                            6. Goals for Next Review Period :
                        </h3>
                        <h3 className='mt-5 mb-3 font-bold text-xl'>Your Goals This Year</h3>

                        <GoalTargetInputField
                            label="Goal 1"
                            value={goal1}
                            onChange={(e) => setGoal1(e.target.value)}
                            rows={3}
                        />

                        <GoalTargetInputField
                            label="Goal 2"
                            value={goal2}
                            onChange={(e) => setGoal2(e.target.value)}
                            rows={3}
                        />

                        <GoalTargetInputField
                            label="Goal 3"
                            value={goal3}
                            onChange={(e) => setGoal3(e.target.value)}
                            rows={3}
                        />
                        <h3 className='mt-5 mb-3 font-bold text-xl'>What You Want to Achieve Next Year</h3>

                        <GoalTargetInputField
                            label="Target 1"
                            value={target1}
                            onChange={(e) => setTarget1(e.target.value)}
                            rows={3}
                        />

                        <GoalTargetInputField
                            label="Target 2"
                            value={target2}
                            onChange={(e) => setTarget2(e.target.value)}
                            rows={3}
                        />

                        <GoalTargetInputField
                            label="Target 3"
                            value={target3}
                            onChange={(e) => setTarget3(e.target.value)}
                            rows={3}
                        />

                    </div>
                    <div style={{ marginBottom: "32px", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "10px" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid #f3f4f6" }}>
                            7. Overall Rating :
                        </h3>
                        <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "20px" }}>
                            Rate your performance from 1 (Needs Improvement) to 5 (Exceptional).
                        </p>

                        {/* Behaviour Rating Grid */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <OverallRatingSelect
                                disabled={isPending}
                                label="Select the Final Overall Performance Rating"
                                currentValue={overallRating}
                                onChange={setOverallRating}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: "32px", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid #f3f4f6" }}>
                            8. Final Comments:
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <FormTextarea
                                disabled={isPending}
                                label="Employee : "
                                value={employeecomment}
                                onChange={(e) => setEmployeecomment(e.target.value)}
                                placeholder=""
                                rows={2}
                            />
                        </div>
                    </div>
                    <div style={{ marginBottom: "32px", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid #f3f4f6" }}>
                            9. Sign-Off:
                        </h3>

                        <div style={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>

                            {/* ===== Employee Sign-Off ===== */}
                            <div style={{ minWidth: "260px", flex: 1 }}>
                                <label
                                    style={{
                                        fontSize: "13px",
                                        color: "#6b7280",
                                        marginBottom: "6px",
                                        display: "block"
                                    }}>
                                    Employee Signature
                                </label>
                                <input
                                    disabled={isPending}
                                    type="text"
                                    value={employeeSignature}
                                    onChange={(e) => setEmployeeSignature(e.target.value)}
                                    placeholder="Type your name as a signature"
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #d1d5db",
                                        fontFamily: "'Pacifico', Great Vibes",
                                        fontSize: "15px"
                                    }}
                                />

                                <label
                                    style={{
                                        fontSize: "13px",
                                        color: "#6b7280",
                                        marginTop: "12px",
                                        marginBottom: "6px",
                                        display: "block"
                                    }}>
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={employeeSignDate}
                                    onChange={(e) => setEmployeeSignDate(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #d1d5db",
                                        fontSize: "15px"
                                    }}
                                />
                            </div>

                            {/* ===== Reviewer Sign-Off ===== */}
                            <div style={{ minWidth: "260px", flex: 1 }}>
                                <label
                                    style={{
                                        fontSize: "13px",
                                        color: "#6b7280",
                                        marginBottom: "6px",
                                        display: "block"
                                    }}>
                                    Reviewer Signature
                                </label>

                                {/* Display only */}
                                <input
                                    type="text"
                                    value={reviewerSign}
                                    readOnly
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #d1d5db",
                                        backgroundColor: "#f9fafb",
                                        fontSize: "15px",
                                        fontFamily: "'Pacifico', Great Vibes", // handwritten style

                                        cursor: "not-allowed"
                                    }}
                                />

                                <label
                                    style={{
                                        fontSize: "13px",
                                        color: "#6b7280",
                                        marginTop: "12px",
                                        marginBottom: "6px",
                                        display: "block"
                                    }}>
                                    Date
                                </label>

                                <input
                                    type="date"
                                    value={reviewerSignDate}
                                    readOnly
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #d1d5db",
                                        backgroundColor: "#f9fafb",
                                        cursor: "not-allowed",
                                        fontSize: "15px"
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Example Footer Button */}
                    <div style={{ marginTop: "40px", textAlign: "right" }}>
                        <button
                            onClick={onClose}
                            style={{
                                padding: "10px 24px",
                                borderRadius: "999px",
                                border: "1px solid #d1d5db",
                                background: "#f9fafb",
                                color: "#374151",
                                fontSize: "15px",
                                cursor: "pointer",
                                marginRight: "12px"
                            }}
                        >
                            Cancel
                        </button>

                        {!isPending && (
                            <button
                                onClick={async () => {
                                    if (isSaving) return;
                                    setIsSaving(true);
                                    setSubmitError(null);
                                    setSubmitMessage(null);

                                    const resolvedName = existingPrs?.name || user?.name || "";
                                    const payload: PRSFormData = {
                                        ...(existingPrs ?? EMPTY_PRS),
                                        id: existingPrs?.id ?? 0,
                                        name: resolvedName,
                                        position: employeePosition === "N/A" ? "" : employeePosition,
                                        department: employeeDepartment === "N/A" ? "" : employeeDepartment,
                                        reviewPeriod,
                                        reviewer: existingPrs?.reviewer ?? "",
                                        kpi1: kpi1Rating?.toString() ?? "",
                                        kpi2: kpi2Rating?.toString() ?? "",
                                        kpi3: kpi3Rating?.toString() ?? "",
                                        kpi4: kpi4Rating?.toString() ?? "",
                                        kpi5: kpi5Rating?.toString() ?? "",
                                        kpi6: kpi6Rating?.toString() ?? "",
                                        kpi7: kpi7Rating?.toString() ?? "",
                                        kpi8: kpi8Rating?.toString() ?? "",
                                        kpi9: kpi9Rating?.toString() ?? "",
                                        kpi10: kpi10Rating?.toString() ?? "",
                                        kpi11: kpi11Rating?.toString() ?? "",
                                        strength: strengthRemarks,
                                        improvement,
                                        well,
                                        challenges,
                                        support,
                                        goal1,
                                        target1,
                                        goal2,
                                        target2,
                                        goal3,
                                        target3,
                                        rating: overallRating ?? "",
                                        empComment: employeecomment,
                                        reviewerComment: existingPrs?.reviewerComment ?? "",
                                        empSign: employeeSignature || resolvedName,
                                        empSignDate: employeeSignDate || new Date().toISOString().split("T")[0],
                                        reviewerSign: existingPrs?.reviewerSign ?? "",
                                        reviewerSignDate: existingPrs?.reviewerSignDate ?? "",
                                        status: "Waiting",
                                    };

                                    try {
                                        const url = existingPrs
                                            ? `${apiBaseUrl}/byname/${encodeURIComponent(resolvedName)}`
                                            : `${apiBaseUrl}`;
                                        const response = await fetch(url, {
                                            method: existingPrs ? "PUT" : "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify(payload),
                                        });

                                        if (!response.ok) {
                                            const errorData = await response.json().catch(() => ({ message: response.statusText }));
                                            throw new Error(errorData.message || "Unable to save review");
                                        }

                                        const data = existingPrs ? payload : await response.json();
                                        onSaved(data);

                                        addToast(existingPrs ? "Review updated successfully." : "Review created successfully.", "success");
                                    } catch (error) {
                                        addToast(error instanceof Error ? error.message : "Unable to save review", "error");
                                    } finally {
                                        setIsSaving(false);
                                    }
                                }}
                                style={{
                                    padding: "10px 24px",
                                    borderRadius: "999px",
                                    border: "none",
                                    background: isSaving ? "#6b7280" : "#111827",
                                    color: "white",
                                    fontSize: "15px",
                                    cursor: isSaving ? "not-allowed" : "pointer",
                                    opacity: isSaving ? 0.8 : 1
                                }}
                                disabled={isSaving}
                            >
                                {isSaving ? "Saving..." : "Save Draft"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
}

// --- Main Page Component (No change) ---
export default function PerformanceReviewSheet() {

    const { user } = useAuth();
    const addToast = useToast();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [existingPrs, setExistingPrs] = useState<PRSFormData | null>(null);
    const [isFetching, setIsFetching] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_PRS_API ?? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PRS`, []);
    const employeeLookupName = (user?.name || "").trim();
    const normalizedLookupName = employeeLookupName.toLowerCase();
    const hasProfileName = Boolean(employeeLookupName);

    useEffect(() => {
        if (!hasProfileName) return;

        const controller = new AbortController();
        setIsFetching(true);
        setFetchError(null);

        const fetchData = async () => {
            try {
                const response = await fetch(`${apiBaseUrl}`, {
                    signal: controller.signal,
                });

                if (!response.ok) {
                    const message = await response.text();
                    throw new Error(message || "Unable to load review data.");
                }

                const data: PRSFormData[] = await response.json();
                const match = data.find((prs) => prs.name?.toLowerCase() === normalizedLookupName) ?? null;
                setExistingPrs(match);
            } catch (error) {
                if (error instanceof DOMException && error.name === "AbortError") return;
                setFetchError(error instanceof Error ? error.message : "Unable to load review data.");
            } finally {
                setIsFetching(false);
            }
        };

        fetchData();

        return () => controller.abort();
    }, [normalizedLookupName, apiBaseUrl, hasProfileName]);

    const handleStartFilling = () => {
        if (!hasProfileName) {
            setFetchError("Unable to determine your profile name. Please contact support.");
            return;
        }
        setIsModalOpen(true);
    };

    const ctaLabel = existingPrs ? "View Submission" : "Start Filling";
    const ctaDescription = existingPrs
        ? "You already have a saved review. View or make updates anytime."
        : "Click the button below to begin filling out your performance review form.";

    return (
        <div style={{ minHeight: "100vh", background: "#f9fafb", padding: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: "900px", background: "white", borderRadius: "16px", boxShadow: "0 10px 20px rgba(0,0,0,0.06)", padding: "24px" }}>

                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Performance Review Sheet</h1>
                    <p style={{ color: "#6b7280", marginTop: "8px" }}>
                        Start a new performance review or view feedback from your reviewer
                    </p>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "24px"
                    }}
                >
                    {/* Start Filling Section */}
                    {/* Start Filling Section */}
                    <div
                        style={{
                            border: "2px dashed #d1d5db",
                            borderRadius: "16px",
                            padding: "24px",
                            textAlign: "center"
                        }}
                    >
                        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>
                            {ctaLabel}
                        </h3>
                        <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "20px" }}>
                            {ctaDescription}
                        </p>

                        {isFetching && (
                            <p style={{ fontSize: "13px", color: "#2563eb", marginBottom: "12px" }}>
                                Loading your latest data...
                            </p>
                        )}

                        {/* View Submission / Start Filling button */}
                        <button
                            onClick={handleStartFilling}
                            style={{
                                padding: "10px 24px",
                                borderRadius: "999px",
                                border: "none",
                                background: "#111827",
                                color: "white",
                                fontSize: "15px",
                                cursor: hasProfileName ? "pointer" : "not-allowed",
                                opacity: hasProfileName ? 1 : 0.7,
                                marginRight: "12px" // optional spacing
                            }}
                            disabled={!hasProfileName}
                        >
                            {ctaLabel}
                        </button>

                        {/* Confirm button only if status is "Waiting" */}
                        {existingPrs?.status === "Waiting" && (
                            <button
                                onClick={async () => {
                                    if (!existingPrs) return;
                                    try {
                                        const url = `${apiBaseUrl}/byname/${encodeURIComponent(existingPrs.name)}`;
                                        const response = await fetch(url, {
                                            method: "PUT",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ ...existingPrs, status: "Pending" }),
                                        });

                                        if (!response.ok) throw new Error("Failed to confirm review");

                                        // Update local state directly since backend may not return JSON
                                        setExistingPrs({ ...existingPrs, status: "Pending" });

                                        addToast("Review confirmed successfully.", "success");
                                    } catch (err) {
                                        addToast(err instanceof Error ? err.message : "Failed to confirm review", "error");
                                    }
                                }}
                                style={{
                                    padding: "10px 24px",
                                    borderRadius: "999px",
                                    background: "#059669",
                                    color: "white",
                                    fontSize: "15px",
                                    cursor: "pointer",
                                    marginLeft: "12px", // optional spacing from the View button
                                }}
                            >
                                Confirm
                            </button>
                        )}


                        {fetchError && (
                            <p style={{ fontSize: "13px", color: "#dc2626", marginTop: "12px" }}>
                                {fetchError}
                            </p>
                        )}
                    </div>


                    {/* Reviewer Feedback Section */}
                    <div
                        style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: "16px",
                            padding: "24px"
                        }}
                    >
                        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>
                            Reviewer Comments
                        </h3>

                        <div
                            style={{
                                background: "#f3f4f6",
                                borderRadius: "12px",
                                padding: "16px",
                                minHeight: "140px",
                                fontSize: "14px",
                                color: "#374151"
                            }}
                        >
                            {existingPrs?.reviewerComment ? (
                                <p style={{ whiteSpace: "pre-line" }}>{existingPrs.reviewerComment}</p>
                            ) : (
                                <p style={{ fontStyle: "italic", color: "#6b7280" }}>
                                    No review submitted yet.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Render the Form Modal */}
            <PerformanceReviewForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={user}
                existingPrs={existingPrs}
                onSaved={(data) => setExistingPrs(data)}
                apiBaseUrl={apiBaseUrl}
            />
        </div>
    )
}