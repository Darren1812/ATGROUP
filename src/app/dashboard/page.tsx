"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowRight,
  Database,
  HelpCircle,
  FileText,
  Briefcase,
  Table,
  Printer,
  Clock,
  Search,
  Goal,
  Paperclip,
  Truck,
  Sparkles,
  LucideIcon,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<"all" | "core" | "tools">("all");
  const [currentTime, setCurrentTime] = useState(new Date());
  type CardItem = {
    title: string;
    description?: string;
    route: string;
    icon: LucideIcon;
    color: string;
    lightColor: string;
    iconColor: string;
    category: string;

    // 👇 NEW
    allowedDepartments?: string[];
  };
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const cards: CardItem[] = [
    {
      title:"INVOICE GENERATOR",
      description:"",
      route:"/InvoiceGenerator",
      icon: Paperclip,
      color:"from-amber-500 to-orange-600",
      lightColor: "bg-amber-50",
      iconColor:"text-amber-600",
      category:"CORE SYSTEM",
      allowedDepartments: ["ATPAdmin", "Management", "Software Engineer", "Boss", "Operations Director"],

    },
    {
      title: "PROPOSAL",
      description: "Create and manage project proposals efficiently with standardized templates.",
      route: "/PPL",
      icon: FileText,
      color: "from-emerald-500 to-teal-600",
      lightColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
      category: "CORE SYSTEM",
      allowedDepartments: ["Sales (Kelantan)","Sales (Melaka)", "Marketing (JB)", "Software Engineer", "Sales (JB)", "Boss", "Operations Director"],

    },
    {
      title: "COMPANY EXPERIENCE",
      description: "Track, manage, and showcase company project history and corporate milestones.",
      route: "/CE",
      icon: Briefcase,
      color: "from-blue-500 to-indigo-600",
      lightColor: "bg-blue-50",
      iconColor: "text-blue-600",
      category: "CORE SYSTEM",
      allowedDepartments: ["Marketing (JB)", "Software Engineer", "Boss", "Operations Director"],
    },
    {
      title: "TENDER MASTER DATABASE",
      description: "Track, manage, and showcase company project history and corporate milestones.",
      route: "/masterdatabase",
      icon: Database,
      color: "from-blue-500 to-indigo-600",
      lightColor: "bg-blue-50",
      iconColor: "text-blue-600",
      category: "CORE SYSTEM",
      allowedDepartments: ["Sales (Kelantan)", "Marketing (JB)", "Software Engineer", "Boss", "Operations Director"],
    },
    {
      title: "Archidex Database",
      description: "Access the centralized master database for all company registration records.",
      route: "/Archidex",
      icon: Database,
      color: "from-rose-500 to-orange-600",
      lightColor: "bg-rose-50",
      iconColor: "text-rose-600",
      category: "CORE SYSTEM",
      allowedDepartments: ["Marketing (JB)", "Software Engineer", "Boss", "Operations Director"],
    },
    {
      title: "Comparison Table",
      description: "Analyze data sets side-by-side.",
      route: "/comparison",
      icon: Table,
      color: "from-slate-500 to-slate-700",
      lightColor: "bg-slate-50",
      iconColor: "text-slate-600",
      category: "COMPARISON",
      allowedDepartments: ["Marketing (JB)", "Software Engineer", "Boss", "Operations Director", "Sales (JB)"],
    },
    {
      title: "Performance Review Sheet",
      description: "Employee goal setting and tracking.",
      route: "/PRS",
      icon: Goal,
      color: "from-amber-500 to-yellow-600",
      lightColor: "bg-amber-50",
      iconColor: "text-amber-600",
      category: "GOAL",
      allowedDepartments: ["Software Engineer"],
    },
    {
      title: "Performance Review Sheet [REVIEW]",
      description: "Administrative review portal.",
      route: "/PRSreview",
      icon: Goal,
      color: "from-red-500 to-rose-600",
      lightColor: "bg-red-50",
      iconColor: "text-red-600",
      category: "REVIEW",
      allowedDepartments: ["Software Engineer"],
    },
    {
      title: "TD HELPER",
      description: "Keyword-based support tool.",
      route: "/ATDF",
      icon: HelpCircle,
      color: "from-emerald-500 to-emerald-600",
      lightColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
      category: "Tools",
      allowedDepartments: ["Software Engineer"],
    },
    {
      title: "TD HELPER v2.0",
      description: "Condition-based logic helper.",
      route: "/tdv2",
      icon: HelpCircle,
      color: "from-emerald-500 to-emerald-600",
      lightColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
      category: "Tools",
      allowedDepartments: ["Software Engineer"],
    },
    {
      title: "PROPOSAL DATA MANAGE",
      description: "Model detail updates.",
      route: "/asnmodelmanage",
      icon: Printer,
      color: "from-cyan-500 to-cyan-600",
      lightColor: "bg-cyan-50",
      iconColor: "text-cyan-600",
      category: "Management",
      allowedDepartments: ["Software Engineer", "Boss", "Operations Director"],
    },
    {
      title: "CLAIM FORM",
      description: "Monthly claim submissions.",
      route: "/ClaimForm",
      icon: FileText,
      color: "from-violet-500 to-purple-600",
      lightColor: "bg-violet-50",
      iconColor: "text-violet-600",
      category: "Forms",
      allowedDepartments: ["Software Engineer"],
    },
    {
      title: "SALES ORDER",
      description: "SALES ORDER.",
      route: "/logisticstable",
      icon: Truck,
      color: "from-violet-500 to-purple-600",
      lightColor: "bg-violet-50",
      iconColor: "text-violet-600",
      category: "CORE SYSTEM",
      allowedDepartments: ["Software Engineer", "Logistics Leader", "Operations Director", "ATPLAN Admin Manager", "ATP Admin Manager", "ATPLAN Admin", "ATP Admin", "ATPLAN Staff", "Boss", "Operations Director"],
    },
    {
      title: "DELIVERY",
      description: "Delivery Tasks.",
      route: "/logisticsmember",
      icon: Truck,
      color: "from-violet-500 to-purple-600",
      lightColor: "bg-violet-50",
      iconColor: "text-violet-600",
      category: "CORE SYSTEM",
      allowedDepartments: ["Software Engineer", "Boss", "Operations Director", "Logistics Leader", "Logistics Team"],
    },
    {
      title:"PRICE LIST",
      description:"",
      route:"/pricelistgenerator",
      icon: Paperclip,
      color:"from-amber-500 to-orange-600",
      lightColor: "bg-amber-50",
      iconColor:"text-amber-600",
      category:"CORE SYSTEM",
      allowedDepartments: ["Software Engineer"],
    },
    {
      title:"QUOTATION GENERATOR",
      description:"",
      route:"/quotation",
      icon: Paperclip,
      color:"from-amber-500 to-orange-600",
      lightColor: "bg-amber-50",
      iconColor:"text-amber-600",
      category:"CORE SYSTEM",
      allowedDepartments: ["Software Engineer", "Sales (JB)", "Marketing (JB)", "Sales (Melaka)"],
    },
    {
      title:"BROCHURE GENERATOR",
      description:"",
      route:"/brochure",
      icon: Paperclip,
      color:"from-amber-500 to-orange-600",
      lightColor: "bg-amber-50",
      iconColor:"text-amber-600",
      category:"CORE SYSTEM",
      allowedDepartments: ["Management", "Software Engineer", "Boss", "Operations Director", "Sales (JB)", "Marketing (JB)", "Sales (Melaka)"],
    }
  ];

  const filteredCards = cards.filter(card => {
    const userDept = user?.department ?? "";

    const inSection = activeSection === "all" ||
      (activeSection === "core" ? card.category === "CORE SYSTEM" : card.category !== "CORE SYSTEM");
    if (!inSection) return false;

    // 🔐 Department restriction
    if (card.allowedDepartments && card.allowedDepartments.length > 0) {
      if (!card.allowedDepartments.includes(userDept)) {
        return false;
      }
    }

    // 🔎 Search filter (keep your existing logic)
    return (
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });
  const coreCards = filteredCards.filter(c => c.category === "CORE SYSTEM");
  const standardCards = filteredCards.filter(c => c.category !== "CORE SYSTEM");

  const greeting = currentTime.getHours() < 12 ? "Good morning" : currentTime.getHours() < 18 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.trim().split(/\s+/)[0] || "there";
  const pastelCards = ["bg-[#cfe8d5]", "bg-[#d1d2ed]", "bg-[#f0cfca]", "bg-[#e9e5b9]", "bg-[#cce5ec]", "bg-[#e8cbed]"];

  const selectSection = (section: "all" | "core" | "tools") => {
    setActiveSection(section);
    setSearchQuery("");
  };

  return (
    <ProtectedRoute>
      <div className="min-h-[calc(100dvh-72px)] w-full bg-[#252528] md:h-dvh md:min-h-0">
        <div className="flex min-h-[calc(100dvh-72px)] w-full max-w-none overflow-hidden bg-[#252528] text-white md:h-dvh md:min-h-0">

          <section className="flex min-h-0 min-w-0 flex-1 flex-col">
            <header className="border-b border-white/10 px-4 py-5 sm:px-6 sm:py-6 lg:px-9">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{greeting}, {firstName}</p>
                    <p className="mt-1 text-xs text-white/45 sm:text-sm">Your systems and tools, all in one place.</p>
                  </div>
                </div>
                <div className="hidden shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 sm:flex">
                  <Clock size={15} className="text-[#cfe8d5]" />
                  <div className="text-right">
                    <p className="text-xs font-semibold">{currentTime.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" })}</p>
                    <p className="text-[10px] text-white/45">{currentTime.toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short" })}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3">
                <div className="relative w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={17} />
                  <input
                    type="search"
                    placeholder="Search systems and tools..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#39393e] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#cfe8d5]/70 focus:ring-2 focus:ring-[#cfe8d5]/15"
                  />
                </div>
                <nav className="flex gap-2 overflow-x-auto pb-1">
                  {([ ["all", "All systems"], ["core", "Primary"], ["tools", "Tools & forms"] ] as const).map(([section, label]) => (
                    <button key={section} onClick={() => selectSection(section)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium ${activeSection === section ? "bg-[#cfe8d5] text-[#171719]" : "border border-white/10 bg-white/[0.04] text-white/65"}`}>
                      {label}
                    </button>
                  ))}
                </nav>
              </div>
            </header>

            <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-9">
              <div className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { label: "Available systems", value: filteredCards.length, note: "Based on your access", color: "text-[#cfe8d5]" },
                  { label: "Primary operations", value: coreCards.length, note: "Core department workflows", color: "text-[#d1d2ed]" },
                  { label: "Tools & forms", value: standardCards.length, note: "Supporting applications", color: "text-[#f0cfca]" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-[#303034] p-4 sm:p-5">
                    <p className="text-xs text-white/50">{item.label}</p>
                    <div className="mt-2 flex items-end justify-between gap-2">
                      <p className={`text-3xl font-semibold tracking-tight ${item.color}`}>{item.value}</p>
                      <p className="text-right text-[10px] text-white/35">{item.note}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">{activeSection === "all" ? "Your workspace" : activeSection === "core" ? "Primary operations" : "Tools & forms"}</p>
                  <h2 className="mt-1 text-lg font-semibold sm:text-xl">Open a system</h2>
                </div>
                <p className="shrink-0 text-xs text-white/40">{filteredCards.length} available</p>
              </div>

              {filteredCards.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 sm:gap-4">
                  {filteredCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                      <button
                        key={card.route}
                        onClick={() => router.push(card.route)}
                        className={`${pastelCards[index % pastelCards.length]} group flex min-h-[190px] flex-col rounded-[22px] p-5 text-left text-[#171719] transition duration-200 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/60 sm:min-h-[210px] sm:p-6`}
                      >
                        <div className="mb-5 flex items-start justify-between gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/60"><Icon size={21} /></div>
                          <span className="rounded-full bg-black/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-black/55">{card.category}</span>
                        </div>
                        <h3 className="text-base font-bold leading-snug sm:text-lg">{card.title}</h3>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-black/60">{card.description || `Open ${card.title.toLowerCase()} workspace.`}</p>
                        <div className="mt-auto flex items-center justify-between pt-5 text-xs font-semibold">
                          <span>Open system</span>
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/60 transition group-hover:translate-x-1"><ArrowRight size={15} /></span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-14 text-center">
                  <Sparkles className="mx-auto mb-3 text-[#d1d2ed]" size={26} />
                  <h3 className="font-semibold">No systems found</h3>
                  <p className="mt-1 text-sm text-white/45">Try another search or choose a different section.</p>
                  <button onClick={() => { setSearchQuery(""); selectSection("all"); }} className="mt-4 rounded-full bg-[#d1d2ed] px-4 py-2 text-xs font-semibold text-[#171719]">Show all systems</button>
                </div>
              )}

              <footer className="mt-8 flex flex-col gap-1 border-t border-white/10 pt-4 text-[10px] text-white/35 sm:flex-row sm:items-center sm:justify-between">
                <span>AT Group Management System</span>
                <span>Access is based on your department</span>
              </footer>
            </main>
          </section>
        </div>
      </div>
    </ProtectedRoute>
  );
}
