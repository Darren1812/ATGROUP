"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
// ================= INTERFACES =================
interface PRS {
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
  status: string;
}

interface User {
  id: number;
  name: string; // Employee name used for comparison
  nameUse: string;
  role: string;
  department: string;
  bod: string;
  email: string;
  position: string;
  mobile: string;
  sign: string;
  status: string;
  approval: string; // Crucial column for filtering
}

// ================= MAIN PAGE COMPONENT =================
export default function PRSReviewPage() {
  const { user } = useAuth();
  const [prsList, setPrsList] = useState<PRS[]>([]);
  const [userList, setUserList] = useState<User[]>([]);
  const [outstandingList, setOutstandingList] = useState<User[]>([]);
  const [selectedPRS, setSelectedPRS] = useState<PRS | null>(null);

  const currentUserName = user?.name;

  // --- Core Data Fetching Functions ---

  const loadPRS = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PRS`);
      if (!res.ok) throw new Error("Failed to fetch PRS data");
      const data = await res.json();
      setPrsList(data);
    } catch (error) {
      console.error("Error loading PRS data:", error);
    }
  };

  // --- Effects ---
  useEffect(() => {
    if (!currentUserName) return;

    const loadUsers = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Account/all-users`);
        if (!res.ok) throw new Error("Failed to fetch user data");
        const data = await res.json();

        if (data.success && Array.isArray(data.users)) {
          // Use 'const' since filteredUsers is never reassigned
          const filteredUsers =
            currentUserName === "Cheong Yan Kiet"
              ? data.users
              : data.users.filter((u: User) => u.approval === currentUserName);

          setUserList(filteredUsers);
        } else {
          console.warn("User data fetch successful, but format invalid or empty:", data);
          setUserList([]);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setUserList([]);
      }
    };

    loadUsers();
    loadPRS(); // call PRS loading here as well
  }, [currentUserName]);

  // --- Comparison Logic ---

  const getOutstandingSubmissions = (assignedUsers: User[], submittedPrs: PRS[]): User[] => {
    // Uses a Set for O(1) average time complexity lookup, highly professional.
    const submittedNames = new Set(submittedPrs.map(prs => prs.name));
    return assignedUsers.filter(user => !submittedNames.has(user.name));
  };

  useEffect(() => {
    if (prsList.length > 0 && userList.length > 0) {
      setOutstandingList(getOutstandingSubmissions(userList, prsList));
    } else if (userList.length > 0 && prsList.length === 0) {
      setOutstandingList(userList);
    } else {
      setOutstandingList([]);
    }
  }, [prsList, userList]);

  // --- Report and UI Functions ---

  const handleDownloadOutstandingReport = () => {
    if (outstandingList.length === 0) {
      alert("No outstanding submissions to report.");
      return;
    }

    const headers = ["Employee Name", "Department", "Position", "Email", "Mobile", "Approval Authority"];
    const csvContent =
      headers.join(",") +
      "\n" +
      outstandingList
        .map(user =>
          `"${user.name}","${user.department}","${user.position}","${user.email}","${user.mobile}","${user.approval}"`
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Outstanding_PRS_Submissions_For_${currentUserName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter the submitted PRS list to show only reviews belonging to assigned employees
  const assignedPrsList = prsList.filter(prs =>
    userList.some(user => user.name === prs.name) && prs.status?.toLowerCase() !== "waiting"
  );

  return (
    <div style={{ padding: "24px" }}>
      <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>
        📝 PRS Review List (Assigned to: {currentUserName || "Loading..."})
      </h2>

      {/* --- Submission Status Report Section --- */}
      <div style={reportSectionStyle}>
        <h3 style={{ fontSize: "18px", marginBottom: "10px", color: "#1f2937" }}>📊 Submission Status Report</h3>
        <p>Total Employees Assigned: {userList.length}</p>
        <p>Submitted PRS by Assigned Employees: {assignedPrsList.length}</p>
        <p style={{ color: outstandingList.length > 0 ? '#b91c1c' : '#059669', fontWeight: 'bold' }}>
          Outstanding Submissions: {outstandingList.length}
        </p>
        <button
          onClick={handleDownloadOutstandingReport}
          style={downloadBtn}
          disabled={outstandingList.length === 0}
        >
          ⬇️ Download Outstanding Report (CSV)
        </button>
      </div>

      <hr />

      {/* --- Outstanding Submissions List (NEW VISUAL LIST) --- */}
      <div style={outstandingListContainerStyle}>
        <h3 style={outstandingHeaderStyle}>🔴 Employees Who Have Not Submitted PRS</h3>
        {outstandingList.length === 0 ? (
          <p style={{ color: '#059669', fontWeight: 'bold', textAlign: 'center' }}>🎉 All assigned employees have submitted their reviews!</p>
        ) : (
          <ul style={outstandingUlStyle}>
            {outstandingList.map((user) => (
              <li key={user.id} style={outstandingLiStyle}>
                {user.name} ({user.department}) - Email: {user.email}
              </li>
            ))}
          </ul>
        )}
      </div>

      <hr />

      {/* --- Filtered Submitted PRS Review List --- */}
      <div
        style={{
          maxHeight: "600px",
          overflowY: "auto",
          border: "1px solid #ccc",
          borderRadius: "8px",
          marginTop: "20px",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#1f2937", color: "#fff" }}>
            <tr>
              <th style={th}>Name</th>
              <th style={th}>Department</th>
              <th style={th}>Review Period</th>
              <th style={th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {assignedPrsList.map((prs) => (
              <tr key={prs.id} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={td}>{prs.name}</td>
                <td style={td}>{prs.department}</td>
                <td style={td}>{prs.reviewPeriod}</td>
                <td style={td}>
                  <button
                    onClick={() => setSelectedPRS(prs)}
                    style={reviewBtn}
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedPRS && user && (
        <ReviewModal
          prs={selectedPRS}
          user={user}  // guaranteed non-null here
          onClose={() => {
            setSelectedPRS(null);
            loadPRS();
          }}
        />
      )}
    </div>
  );
}
interface AuthUser {
  name: string;
  position: string;
  department: string;
  role: string;
  nameUse?: string;
  Approval: string; // Note: Ensure this matches the case (Approval vs approval) in your context
}
// ================= MODAL COMPONENT =================
interface ReviewModalProps {
  prs: PRS;
  user: AuthUser;
  onClose: () => void;
}

const TabContainer = ({ children, index, activeTab }: { children: React.ReactNode; index: number; activeTab: number }) => (
  <div style={{ display: activeTab === index ? "block" : "none" }}>{children}</div>
);

const tabs = [
  { title: "Employee Info", key: "info" },
  { title: "KPI Review (11)", key: "kpis" },
  { title: "Narrative Feedback", key: "feedback" },
  { title: "Goals & Targets", key: "goals" },
  { title: "Sign-Off", key: "signoff" },
];

const performanceKpiLabels = [
  "Quality of Work",           // kpi1
  "Productivity / Output",     // kpi2
  "Attendance & Punctuality",  // kpi3
  "Meeting Deadlines",         // kpi4
  "Knowledge & Skills",        // kpi5
  "Compliance / SOP Adherence",// kpi6
];

const behaviourMetricLabels = [
  "Responsibility & Ownership",// kpi7
  "Teamwork & Cooperation",    // kpi8
  "Communication",             // kpi9
  "Initiative & Problem-Solving",// kpi10
  "Customer Service",          // kpi11
];

const ReviewModal = ({ prs, user, onClose }: ReviewModalProps) => {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

  const [formData, setFormData] = useState<PRS>(() => ({
    ...prs,
    reviewer: user?.name || prs.reviewer || "",
    reviewerSign: user?.name || prs.reviewerSign || "",
    reviewerSignDate: prs.reviewerSignDate || today,
  }));

  const [activeTab, setActiveTab] = useState(0);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleApprove = async () => {
    try {
      const finalData = {
        ...formData,
        reviewerComment: formData.reviewerComment
          ? `${formData.reviewerComment}\n- ${user?.name}`
          : `- ${user?.name}`,   // in case comment is empty
        reviewerSign: user?.name,
        reviewerSignDate: today
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PRS/byname/${prs.name}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalData), // use finalData, not formData
        }
      );

      if (!res.ok) throw new Error("Failed save");

      alert("✅ PRS Updated Successfully");
      onClose();
    } catch (error) {
      console.error(error); // log the real error
      alert("❌ Failed to update PRS");
    }
  };


  return (
    <div style={overlay}>
      <div style={modal}>
        <h2 style={{ fontSize: "20px", marginBottom: "10px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
          Performance Review for: <b>{prs.name}</b>
        </h2>

        <div style={tabNavStyle}>
          {tabs.map((tab, index) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(index)}
              style={index === activeTab ? activeTabBtn : inactiveTabBtn}
            >
              {tab.title}
            </button>
          ))}
        </div>

        {/* TAB 1: Employee Info */}
        <TabContainer index={0} activeTab={activeTab}>
          <div style={sectionStyle}>
            <h3 style={sectionHeader}>Personnel Details</h3>
            <div style={twoColumnLayout}>
              <ReadOnlyField label="Employee Name" value={formData.name} />
              <Input
                key="reviewer"
                label="Reviewer Name"
                name="reviewer"
                value={formData.reviewer}
                onChange={handleChange}
              />
              <ReadOnlyField label="Position" value={formData.position} />
              <ReadOnlyField label="Department" value={formData.department} />
              <ReadOnlyField label="Review Period" value={formData.reviewPeriod} />
            </div>
          </div>
        </TabContainer>

        {/* TAB 2: KPI Review (Separated Sections) */}
        <TabContainer index={1} activeTab={activeTab}>
          <div style={sectionStyle}>

            {/* === SECTION 1: KEY PERFORMANCE INDICATORS (kpi1 - kpi6) === */}
            <h3 style={{ ...sectionHeader, color: '#2563eb' }}>1. Key Performance Indicators (Rate 1-5)</h3>
            <div style={gridKpiLayout}>
              {performanceKpiLabels.map((label, i) => {
                const key = `kpi${i + 1}` as keyof PRS;
                return (
                  <Input
                    key={key}
                    label={label}
                    name={key}
                    value={formData[key] as string}
                    onChange={handleChange}
                  />
                );
              })}
            </div>

            <hr style={{ margin: "20px 0", borderTop: "1px dashed #ccc" }} />

            {/* === SECTION 2: BEHAVIOUR & ATTITUDE (kpi7 - kpi11) === */}
            <h3 style={{ ...sectionHeader, color: '#2563eb' }}>2. Behaviour & Attitude (Rate 1-5)</h3>
            <div style={gridKpiLayout}>
              {behaviourMetricLabels.map((label, i) => {
                // Index offset is crucial here: i=0 maps to kpi7, i=1 maps to kpi8, etc.
                const kpiIndex = i + 7;
                const key = `kpi${kpiIndex}` as keyof PRS;
                return (
                  <Input
                    key={key}
                    label={label}
                    name={key}
                    value={formData[key] as string}
                    onChange={handleChange}
                  />
                );
              })}
            </div>
          </div>
        </TabContainer>

        {/* TAB 3: Narrative Feedback */}
        <TabContainer index={2} activeTab={activeTab}>
          <div style={sectionStyle}>
            <h3 style={sectionHeader}>Reviewer&#39;s Narrative Feedback</h3>
            <Textarea label="Strength" name="strength" value={formData.strength} onChange={handleChange} />
            <Textarea label="Areas for Improvement" name="improvement" value={formData.improvement} onChange={handleChange} />
            <Textarea label="What Went Well" name="well" value={formData.well} onChange={handleChange} />
            <Textarea label="Challenges Faced" name="challenges" value={formData.challenges} onChange={handleChange} />
            <Textarea label="Support Needed" name="support" value={formData.support} onChange={handleChange} />
          </div>
        </TabContainer>

        {/* TAB 4: Goals & Targets */}
        <TabContainer index={3} activeTab={activeTab}>
          <div style={sectionStyle}>
            <h3 style={sectionHeader}>Future Goals & Targets</h3>
            <GoalTargetGroup goalLabel="Goal 1" targetLabel="Target 1" goalName="goal1" targetName="target1" formData={formData} handleChange={handleChange} />
            <GoalTargetGroup goalLabel="Goal 2" targetLabel="Target 2" goalName="goal2" targetName="target2" formData={formData} handleChange={handleChange} />
            <GoalTargetGroup goalLabel="Goal 3" targetLabel="Target 3" goalName="goal3" targetName="target3" formData={formData} handleChange={handleChange} />
          </div>
        </TabContainer>

        {/* TAB 5: Sign-Off */}
        <TabContainer index={4} activeTab={activeTab}>
          <div style={sectionStyle}>
            <h3 style={sectionHeader}>Final Comments and Rating</h3>
            <Textarea label="Employee Comment" name="empComment" value={formData.empComment} onChange={handleChange} />
            <Textarea label="Reviewer Comment" name="reviewerComment" value={formData.reviewerComment} onChange={handleChange} />

            <Input label="Final Performance Rating" name="rating" value={formData.rating} onChange={handleChange} />

            <h3 style={sectionHeader}>Signatures</h3>
            <div style={twoColumnLayout}>
              <SignatureBlock label="Employee Sign-Off" nameSign="empSign" nameDate="empSignDate" formData={formData} handleChange={handleChange} />
              <SignatureBlock label="Reviewer Sign-Off" nameSign="reviewerSign" nameDate="reviewerSignDate" formData={formData} handleChange={handleChange} />
            </div>
          </div>
        </TabContainer>

        {/* Footer Buttons */}
        <div style={{ textAlign: "right", marginTop: "20px", paddingTop: "10px", borderTop: "1px solid #eee" }}>
          <button onClick={onClose} style={cancelBtn}>Cancel</button>
          <button onClick={handleApprove} style={approveBtn}>Save</button>
        </div>
      </div>
    </div>
  );
};
interface GoalTargetInputFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  width?: string;
  rows?: number;
  name?: string;
}

const GoalTargetInputField = ({
  label,
  value,
  onChange,
  placeholder,
  width = '100%',
  rows = 4,
}: GoalTargetInputFieldProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', width }}>
    <label style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>
      {label}
    </label>
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={{
        fontSize: '14px',
        color: '#1f2937',
        padding: '8px 12px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        backgroundColor: 'white',
        resize: 'vertical',
      }}
    />
  </div>
);

// ================= REUSABLE COMPONENTS =================
interface GoalTargetGroupProps {
  goalLabel: string;
  targetLabel: string;
  goalName: keyof PRS;
  targetName: keyof PRS;
  formData: PRS;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const GoalTargetGroup: React.FC<GoalTargetGroupProps> = ({
  goalLabel,
  targetLabel,
  goalName,
  targetName,
  formData,
  handleChange,
}) => (
  <div style={goalTargetGroupStyle}>
    <GoalTargetInputField
      label={goalLabel}
      name={goalName}                      // Pass the field name
      value={String(formData[goalName])}   // Ensure value is a string
      onChange={handleChange}              // Pass the real event
      placeholder=""
      rows={3}
    />
    <GoalTargetInputField
      label={targetLabel}
      name={targetName}                    // Pass the field name
      value={String(formData[targetName])} // Ensure value is a string
      onChange={handleChange}              // Pass the real event
      placeholder=""
      rows={3}
    />
  </div>
);


interface SignatureBlockProps<T> {
  label: string;
  nameSign: keyof T; // Ensures nameSign is a valid key of your data
  nameDate: keyof T; // Ensures nameDate is a valid key of your data
  formData: T;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// We use <T,> to tell TS this is a generic function
const SignatureBlock = <T,>({ 
  label, 
  nameSign, 
  nameDate, 
  formData, 
  handleChange 
}: SignatureBlockProps<T>) => {
  return (
    <div style={signatureBlockStyle}>
      <label style={{ fontWeight: "bold", display: "block", marginBottom: "10px" }}>
        {label}
      </label>
      <Input 
        key={nameSign as string} 
        label="Signature" 
        name={nameSign as string} 
        value={formData[nameSign] as string} // Cast to string for the Input value
        onChange={handleChange} 
      />
      <Input 
        key={nameDate as string} 
        label="Date" 
        name={nameDate as string} 
        value={formData[nameDate] as string} 
        onChange={handleChange} 
        type="date" 
      />
    </div>
  );
};
const ReadOnlyField = ({ label, value }: { label: string; value: string }) => (
  <div style={readOnlyFieldStyle}>
    <label style={{ fontWeight: "bold", color: "#666", fontSize: "12px", display: "block", marginBottom: "2px" }}>{label}</label>
    <p style={{ marginTop: 0, padding: "5px 8px", background: "#f8f8f8", border: "1px solid #eee", borderRadius: "4px", minHeight: "30px" }}>{value}</p>
  </div>
);

interface InputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; // optional, defaults to "text"
}

const Input = ({ label, name, value, onChange, type = "text" }: InputProps) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", marginBottom: "10px" }}>
      <label><b>{label}</b></label>
      <input
        name={name}
        value={value || ""}
        onChange={onChange}
        type={type}
        style={inputStyle}
      />
    </div>
  );
};


interface TextareaProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const Textarea = ({ label, name, value, onChange }: TextareaProps) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", marginBottom: "15px" }}>
      <label><b>{label}</b></label>
      <textarea
        name={name}
        value={value || ""}
        onChange={onChange}
        style={textareaStyle}
        rows={4}
      />
    </div>
  );
};
// ================= STYLES =================
const th = { padding: "10px" };
const td = { padding: "10px" };
const reviewBtn = { padding: "6px 12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" };
const cancelBtn = { padding: "8px 14px", background: "#6b7280", color: "white", border: "none", borderRadius: "6px", marginRight: "10px", cursor: "pointer" };
const approveBtn = { padding: "8px 16px", background: "#16a34a", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" };
const overlay = {
  position: "fixed" as const,
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  // ADD THIS LINE
  zIndex: 1000
};
const modal = { background: "#fff", padding: "20px", width: "80%", maxHeight: "90vh", overflowY: "scroll" as const, borderRadius: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.2)" };
const inputStyle = { padding: "8px", border: "1px solid #ddd", borderRadius: "5px", width: "100%", boxSizing: "border-box" as const };
const textareaStyle = { ...inputStyle, resize: "vertical" as const, minHeight: "80px" };
const tabNavStyle = { display: "flex", marginBottom: "20px", borderBottom: "2px solid #ddd" };
const inactiveTabBtn = { padding: "10px 15px", border: "none", background: "transparent", cursor: "pointer", marginRight: "5px", fontSize: "16px", color: "#666", borderBottom: "2px solid transparent", transition: "all 0.3s" };
const activeTabBtn = { ...inactiveTabBtn, fontWeight: "bold" as const, color: "#2563eb", borderBottom: "2px solid #2563eb" };
const sectionStyle = { padding: "15px", border: "1px solid #ddd", borderRadius: "8px", marginBottom: "20px", background: "#fcfcfc" };
const sectionHeader = { fontSize: "18px", marginBottom: "15px", paddingBottom: "5px", borderBottom: "1px dotted #ccc", color: "#1f2937" };
const twoColumnLayout = { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "20px", alignItems: "start" };
const gridKpiLayout = { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px", alignItems: "start" };
const goalTargetGroupStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "15px", padding: "10px", border: "1px solid #eee", borderRadius: "4px" };
const signatureBlockStyle = { padding: "10px", border: "1px solid #eee", borderRadius: "4px" };
const readOnlyFieldStyle = { marginBottom: "10px" };
const reportSectionStyle = {
  padding: "15px",
  border: "1px solid #2563eb",
  borderRadius: "8px",
  marginBottom: "20px",
  background: "#eff6ff",
  display: "flex",
  flexDirection: "column" as const,
  gap: "5px"
};
const downloadBtn = {
  marginTop: "10px",
  padding: "8px 16px",
  background: "#059669",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer"
};

// --- NEW STYLES FOR OUTSTANDING LIST ---
const outstandingListContainerStyle = {
  padding: "15px",
  border: "1px solid #b91c1c",
  borderRadius: "8px",
  marginBottom: "20px",
  background: "#fef2f2",
};
const outstandingHeaderStyle = {
  fontSize: "18px",
  marginBottom: "10px",
  color: "#b91c1c",
  paddingBottom: "5px",
  borderBottom: "1px solid #ef4444"
};
const outstandingUlStyle = {
  listStyleType: 'disc',
  paddingLeft: '20px',
  margin: '10px 0 0 0',
};
const outstandingLiStyle = {
  marginBottom: '5px',
  color: '#374151',
  lineHeight: '1.4',
};