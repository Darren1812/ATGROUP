"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { FileText, Search } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";

// 1. Dynamic Imports (Optimizes performance so only the selected template loads)
const C_ATP = dynamic(() => import("@/components/templates/C_ATP"), { ssr: false });
const G_ATP = dynamic(() => import("@/components/templates/G_ATP"), { ssr: false });
const ASN_29series = dynamic(() => import("@/components/templates/ASN_29series"), { ssr: false });
const ARENA = dynamic(() => import("@/components/templates/ARENA"), { ssr: false });
const SKY = dynamic(() => import("@/components/templates/SKY"), { ssr: false });


// 2. The Component Map - This handles "the others" automatically
const TEMPLATE_MAP: Record<string, React.ComponentType> = {
  C_ATP: C_ATP,
  G_ATP: G_ATP,
  ASN_29series: ASN_29series,
  ARENA: ARENA,
  SKY: SKY
};

const templates = [
  { id: "C_ATP", name: "ATP Commercial", desc: "ATP COMMERCIAL PROPOSAL", icon: <FileText size={20} /> },
  { id: "G_ATP", name: "Government ATP", desc: "NOT AVAILABLE NOW", icon: <FileText size={20} /> },
  { id: "ASN_29series", name: "ASN Series", desc: "ASN PROPOSAL ", icon: <FileText size={20} /> },
  { id: "ARENA", name: "ARENA", desc: "ARENA PROPOSAL", icon: <FileText size={20} /> },
  { id: "SKY", name: "SKY", desc: "SKY PROPOSAL", icon: <FileText size={20} /> },
];

export default function PPLPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  // Helper to render the active component
  const renderTemplate = () => {
    const Component = TEMPLATE_MAP[selectedTemplate];
    return Component ? <Component /> : null;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f8fafc] p-6 md:p-12 text-slate-900">
        <div className="max-w-7xl mx-auto">

          {/* Header Section */}
          <header className="mb-12">
            <h1 className="text-[10px] font-bold tracking-[0.2em] text-blue-600 uppercase mb-2">
              Workspace
            </h1>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
              Proposal Generator
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
              Select a refined template to begin drafting your proposal. All documents are pre-formatted for professional standards.
            </p>
          </header>

          {/* Template Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={`group relative text-left p-6 rounded-2xl border transition-all duration-300 ${selectedTemplate === t.id
                    ? "bg-white border-blue-600 ring-4 ring-blue-50 shadow-xl scale-[1.02]"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
                  }`}
              >
                <div className={`mb-4 p-3 w-fit rounded-xl transition-colors ${selectedTemplate === t.id
                    ? "text-blue-600 bg-blue-50"
                    : "text-slate-400 bg-slate-50 group-hover:bg-slate-100"
                  }`}>
                  {t.icon}
                </div>
                <h3 className="font-bold text-slate-800 text-sm tracking-tight">{t.name}</h3>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-normal">{t.desc}</p>

                {selectedTemplate === t.id && (
                  <div className="absolute top-4 right-4 w-2 h-2 bg-blue-600 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Canvas Area */}
          <main className={`relative min-h-[500px] rounded-[2rem] transition-all duration-500 ${selectedTemplate
              ? "bg-white border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden"
              : "border-2 border-dashed border-slate-200 bg-slate-50/50"
            }`}>
            {selectedTemplate ? (
              <div className="animate-in fade-in zoom-in-95 duration-500">
                {renderTemplate()}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-32 text-center">
                <div className="bg-white p-6 rounded-full shadow-sm mb-6">
                  <Search className="text-slate-300 w-10 h-10" />
                </div>
                <h3 className="text-slate-800 font-semibold text-lg">No template selected</h3>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">
                  Pick a card from the library above to start generating your professional proposal.
                </p>
              </div>
            )}
          </main>

        </div>
      </div>
    </ProtectedRoute>
  );
}