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
  Users,
  ChevronRight,
  Table,
  Printer,
  Clock,
  Search,
  Goal,
  Bell,
  TrendingUp,
  ArrowUpRight,
  Paperclip,
  LightbulbIcon,
  Truck
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const allowedReviewUsers = ["Darren Wong", "Cheong Yan Kiet", "Boon Yee Kuan", "Wong Mei Jean", "Phang Ye Woon"];
  type CardItem = {
    title: string;
    description?: string;
    route: string;
    icon: any;
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
      allowedDepartments: ["ATPAdmin", "Management", "Software Engineer"],

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
      allowedDepartments: ["Marketing", "Software Engineer", "Sales"],

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
      allowedDepartments: ["Marketing", "Software Engineer", "Sales"],
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
      allowedDepartments: ["Marketing", "Software Engineer", "Sales"],
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
      allowedDepartments: ["Marketing", "Software Engineer", "Sales"],
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
      allowedDepartments: ["Marketing", "Software Engineer", "Sales"],
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
      allowedDepartments: ["Marketing", "Software Engineer", "Sales"],
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
      allowedDepartments: [],
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
      route: "/page2",
      icon: Truck,
      color: "from-violet-500 to-purple-600",
      lightColor: "bg-violet-50",
      iconColor: "text-violet-600",
      category: "CORE SYSTEM",
      allowedDepartments: ["Software Engineer"],
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
      allowedDepartments: ["Software Engineer"],
    },
  ];

  const filteredCards = cards.filter(card => {
    const userDept = user?.department ?? "";

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

  return (
    <ProtectedRoute>
      <div className="bg-white border-b border-slate-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-slate-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">
                    {user?.name?.charAt(0) || "M"}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-light text-slate-800 tracking-tight">
                    {user ? `Welcome back, ${user.name}` : "USER"}
                  </h1>
                  <p className="text-slate-500 text-sm mt-0.5">Choose a system to get started</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <Clock className="text-slate-500" size={16} />
                <div className="text-sm">
                  <div className="font-medium text-slate-800">
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-xs text-slate-500">
                    {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-8 py-10">
          {/* Search Bar */}
          <div className="relative mb-12 max-w-2xl mx-auto">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search for a system or tool..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all shadow-sm text-lg"
            />
          </div>
          {/* 1. CORE SYSTEMS - The Big Cards */}
          {!searchQuery && coreCards.length > 0 && (
            <div className="mb-16">
              <h2 className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase mb-6 flex items-center gap-3">
                Primary Operations <div className="h-px flex-1 bg-slate-200" />
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {coreCards.map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={index}
                      onClick={() => router.push(card.route)}
                      className="group relative bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden transform hover:-translate-y-2"
                    >
                      <div className={`absolute -right-12 -top-12 w-48 h-48 bg-gradient-to-br ${card.color} opacity-[0.03] group-hover:opacity-[0.08] rounded-full transition-all duration-700 group-hover:scale-150`} />

                      <div className="relative z-10 h-full flex flex-col">
                        <div className={`${card.lightColor} w-16 h-16 rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform duration-500 mb-8`}>
                          <Icon className={`${card.iconColor}`} size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">{card.title}</h3>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 flex-grow">{card.description}</p>
                        <div className="flex items-center gap-2 text-xs font-black text-slate-900 tracking-widest group-hover:gap-4 transition-all uppercase">
                          Access System <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-900" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-10 items-start max-w-7xl mx-auto p-6">

            {/* LEFT ZONE: The Scrollable Container */}
            <div className="flex-1 w-full bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">

              {/* 1. Header Area (Fixed) */}
              <div className="px-8 py-6 bg-white border-b border-slate-50">
                <h2 className="text-[11px] font-black tracking-[0.4em] text-slate-400 uppercase flex items-center gap-4">
                  Supporting Tools
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
                </h2>
              </div>

              {/* 2. Scrollable Body (This is where the magic happens) */}
              {/* h-[520px] is the sweet spot to show 4 cards and cut off the 5th/6th */}
              <div className="h-[380px] overflow-y-auto custom-scrollbar p-6">
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  {standardCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                      <div
                        key={index}
                        onClick={() => router.push(card.route)}
                        className="group bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 transition-all duration-300 hover:shadow-md hover:border-indigo-100 cursor-pointer"
                      >
                        <div className={`${card.lightColor} w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center`}>
                          <Icon className={`${card.iconColor}`} size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-slate-800 font-bold text-[12px] uppercase tracking-tight truncate">{card.title}</h4>
                          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">{card.category}</p>
                        </div>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-transform group-hover:translate-x-1" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Footer Area (Fixed) */}
              <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-center items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" />
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  Scroll for more tools
                </span>
              </div>
            </div>

            {/* RIGHT ZONE: Premium Sidebar (30%) */}
            <div className="w-full lg:w-80 flex-shrink-0 space-y-6 lg:sticky lg:top-6">

              {/* Forecast Engine - The 'Insight' Card */}
              <div
                onClick={() => router.push("/forecast")}
                className="group relative bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-500 cursor-pointer overflow-hidden"
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:rotate-6 transition-transform">
                      <TrendingUp className="text-white" size={20} />
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                      </span>
                      <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">3 Updates</span>
                    </div>
                  </div>

                  <h4 className="text-slate-900 font-black text-sm uppercase tracking-wider">Forecast Engine</h4>
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border-l-2 border-indigo-500 group-hover:bg-white transition-colors">
                    <p className="text-[10px] text-slate-500 font-medium italic line-clamp-2 leading-relaxed">
                      &quot;Q4 projections show a 12% increase in contract volume...&quot;
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Live Analysis</span>
                    <ArrowUpRight size={14} className="text-indigo-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Admin Portal - The 'Power' Card */}
              {["Darren Wong", "Cheong Yan Kiet", "Boon Yee Kuan", "Wong Mei Jean"].includes(user?.name ?? "") && (
                <div
                  onClick={() => router.push("/Usermanagement")}
                  className="group relative bg-slate-950 rounded-[24px] p-6 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-slate-900/40 cursor-pointer border border-slate-800"
                >
                  {/* Subtle Inner Glow */}
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <div className="bg-white/10 backdrop-blur-md w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-white group-hover:text-slate-900 transition-all duration-500">
                        <Users size={20} />
                      </div>
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b]" />
                    </div>

                    <h4 className="text-white font-black text-sm uppercase tracking-wider">Admin Portal</h4>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Management Console</p>

                    <div className="mt-6 h-[1px] w-full bg-slate-800" />
                    <div className="mt-4 flex items-center gap-2 text-[9px] text-slate-400 font-black uppercase tracking-widest">
                      Access Granted <div className="h-1 w-1 rounded-full bg-slate-600" /> Secured
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>          {/* Empty State */}
          {filteredCards.length === 0 && (
            <div className="py-24 text-center">
              <div className="bg-white inline-flex p-6 rounded-full shadow-inner mb-4">
                <Search size={40} className="text-slate-200" />
              </div>
              <h3 className="text-slate-800 font-black text-xl mb-1 uppercase tracking-tight">No results found</h3>
              <p className="text-slate-400 text-sm">We couldn&apos;t find any system matching &quot;{searchQuery}&quot;</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}