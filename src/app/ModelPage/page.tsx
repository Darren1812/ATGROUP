"use client"; 

import { useRouter } from "next/navigation";
import { Printer, BarChart3, Settings, Database, ArrowRight } from "lucide-react";

const CopierHub = () => {
    const router = useRouter();

    const modules = [
        {
            title: "Model Details",
            desc: "Manage and track all physical copier units across branches.",
            icon: <Printer size={24} className="text-emerald-600" />,
            path: "/asnmodelmanage",
        },
        {
            title: "All Model Here",
            desc: "Monitor meter readings, print volumes, and cost analysis.",
            icon: <BarChart3 size={24} className="text-blue-600" />,
            path: "/AllModel",
        },
        {
            title: "Invoice Generator",
            desc: "Generate Invoice refer to Excel Data",
            icon: <Settings size={24} className="text-amber-600" />,
            path: "/generateinvoice",
        },
        {
            title: "Raw Data Export",
            desc: "Download historical logs and system reports for auditing.",
            icon: <Database size={24} className="text-slate-600" />,
            path: "/copiers/reports",
        }
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-slate-50/30">
            {/* Header Section */}
            <div className="mb-12">
                <div className="flex items-center gap-3 mb-3">
                    <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-slate-100">
                        <Printer className="text-emerald-600" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
                            Copier Data Hub
                        </h1>
                        <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">
                            Centralized Management System
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {modules.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => router.push(item.path)} // Using Next.js navigation
                        className="group relative bg-white border border-slate-200 p-8 rounded-[2.5rem] text-left hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 active:scale-95 overflow-hidden"
                    >
                        {/* Subtle background glow on hover */}
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-slate-50 rounded-full group-hover:bg-emerald-50 transition-colors duration-500" />

                        <div className="relative z-10">
                            <div className="mb-6 inline-flex p-3 bg-slate-50 rounded-2xl group-hover:bg-white group-hover:shadow-sm transition-all">
                                {item.icon}
                            </div>
                            
                            <h3 className="text-lg font-black text-slate-800 mb-3 group-hover:text-emerald-700 transition-colors">
                                {item.title}
                            </h3>
                            
                            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                                {item.desc}
                            </p>
                            
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-emerald-600 transition-all">
                                View Data <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CopierHub;