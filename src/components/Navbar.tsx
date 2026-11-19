'use client';

import Image from "next/image";
import React, { useState } from "react";
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from "@/components/ToastProvider";
import { useAuth } from "@/context/AuthContext";
import ProfileAvatar from "@/components/ProfileAvatar";
import { Home, LogOut, Menu, X, Printer, Boxes, TrendingUp, Users, ChevronLeft, ChevronRight } from "lucide-react";

const navItems = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Model", href: "/ModelPage", icon: Printer },
  { label: "BUTTON 3", href: "/", icon: Boxes },
  { label: "BUTTON 4", href: "/page4", icon: Boxes },
];

export default function Navbar({
  sidebarCollapsed,
  onToggleSidebar,
}: {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const addToast = useToast();
  const { user, logout: authLogout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const noNavbarRoutes = ['/', '/'];
  if (noNavbarRoutes.includes(pathname)) return null;

  const handleLogout = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Account/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: user?.name }),
      });
      if (response.ok) {
        const data = await response.json();
        addToast(data.message || "Logged out successfully", "success");
      } else {
        addToast("Logged out from this device", "success");
      }
    } catch {
      addToast("Logged out from this device", "success");
    } finally {
      authLogout();
      router.replace("/");
    }
  };

  const renderLinks = (compact = false) => navItems.map((item) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;
    return (
      <button
        key={item.label}
        onClick={() => {
          setMobileMenuOpen(false);
          router.push(item.href);
        }}
        title={compact ? item.label : undefined}
        aria-label={compact ? item.label : undefined}
        className={`relative flex w-full items-center gap-3 rounded-xl ${compact ? "justify-center px-2" : "px-3.5"} py-3 text-left text-sm transition ${isActive ? "bg-[#cfe8d5] font-semibold text-[#171719]" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
      >
        <Icon size={17} />
        {!compact && <span>{item.label}</span>}
        {isActive && <span className={`${compact ? "absolute bottom-1 right-1" : "ml-auto"} h-1.5 w-1.5 rounded-full bg-[#171719]`} />}
      </button>
    );
  });

  return (
    <nav className={`sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm transition-[width] duration-200 md:fixed md:inset-y-0 md:left-0 md:flex md:flex-col md:border-b-0 md:border-r md:border-white/10 md:bg-[#111113] md:shadow-none ${sidebarCollapsed ? "md:w-20" : "md:w-64"}`}>
      {/* Desktop sidebar */}
      <div className={`hidden h-full flex-col md:flex ${sidebarCollapsed ? "items-center p-3" : "p-5 lg:p-6"}`}>
        <div className={`mb-8 flex w-full items-start ${sidebarCollapsed ? "flex-col items-center gap-3" : "justify-between gap-2"}`}>
          <button onClick={() => router.push("/dashboard")} title="AT Group Home" className={`text-left ${sidebarCollapsed ? "" : "flex-1"}`}>
            {sidebarCollapsed ? (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#cfe8d5] text-sm font-black text-[#171719]">AT</div>
            ) : (
              <>
                <div className="rounded-xl bg-white px-3 py-2">
                  <Image src="/images/logo-top-panel-atgroup.png" alt="AT Group Logo" width={145} height={44} className="h-auto w-full object-contain" priority />
                </div>
                <p className="mt-2 pl-1 text-[10px] text-white/45">Management System</p>
              </>
            )}
          </button>
          <button
            onClick={onToggleSidebar}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="rounded-lg p-2 text-white/55 transition hover:bg-white/10 hover:text-white"
          >
            {sidebarCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          </button>
        </div>

        {!sidebarCollapsed && <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Navigation</p>}
        <div className="w-full space-y-1.5">{renderLinks(sidebarCollapsed)}</div>

        <div className={`mt-auto w-full space-y-1.5 border-white/10 pt-4 ${sidebarCollapsed ? "border-t" : "border-t"}`}>
          {!sidebarCollapsed && <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Quick access</p>}
          <button onClick={() => router.push("/forecast")} title={sidebarCollapsed ? "Forecast engine" : undefined} className={`flex w-full items-center gap-3 rounded-xl py-3 text-left text-sm text-white/70 transition hover:bg-white/10 hover:text-white ${sidebarCollapsed ? "justify-center px-2" : "px-3.5"}`}>
            <TrendingUp size={17} />{!sidebarCollapsed && <span>Forecast engine</span>}
          </button>
          {user?.name === "Darren Wong" && (
            <button onClick={() => router.push("/Usermanagement")} title={sidebarCollapsed ? "Admin portal" : undefined} className={`flex w-full items-center gap-3 rounded-xl py-3 text-left text-sm text-white/70 transition hover:bg-white/10 hover:text-white ${sidebarCollapsed ? "justify-center px-2" : "px-3.5"}`}>
              <Users size={17} />{!sidebarCollapsed && <span>Admin portal</span>}
            </button>
          )}
        </div>

        <div className={`mt-4 flex w-full items-center rounded-2xl border border-white/10 bg-white/[0.04] p-2 ${sidebarCollapsed ? "flex-col gap-2" : "gap-3 p-3"}`}>
          <ProfileAvatar userId={user?.id} name={user?.name || "User"} className="h-9 w-9" />
          {!sidebarCollapsed && <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{user?.name || "User"}</p>
            <p className="truncate text-[10px] text-white/45">{user?.department || "AT Group"}</p>
          </div>}
          <button onClick={handleLogout} title="Log out" className="rounded-lg p-2 text-white/45 transition hover:bg-white/10 hover:text-white"><LogOut size={16} /></button>
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="flex h-16 items-center justify-between px-4 md:hidden">
        <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2">
          <Image src="/images/logo-top-panel-atgroup.png" alt="AT Group Logo" width={128} height={42} className="h-9 w-auto object-contain" priority />
        </button>
        <div className="flex items-center gap-3">
          <ProfileAvatar userId={user?.id} name={user?.name || "User"} className="h-8 w-8" />
          <button onClick={() => setMobileMenuOpen((open) => !open)} aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"} className="rounded-lg p-2 text-slate-700 hover:bg-slate-100">
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-[60] bg-black/40 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="flex h-full w-[min(86vw,320px)] flex-col bg-[#111113] p-5 text-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Navigation</p>
            <div className="space-y-1.5">{renderLinks()}</div>
            <div className="mt-5 space-y-1.5 border-t border-white/10 pt-4">
              <button onClick={() => { setMobileMenuOpen(false); router.push("/forecast"); }} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm text-white/70 hover:bg-white/10"><TrendingUp size={17} />Forecast engine</button>
              {user?.name === "Darren Wong" && <button onClick={() => { setMobileMenuOpen(false); router.push("/Usermanagement"); }} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm text-white/70 hover:bg-white/10"><Users size={17} />Admin portal</button>}
            </div>
            <div className="mt-auto flex items-center gap-3 border-t border-white/10 pt-4">
              <ProfileAvatar userId={user?.id} name={user?.name || "User"} className="h-9 w-9" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{user?.name || "User"}</p>
                <p className="truncate text-xs text-white/45">{user?.department || "AT Group"}</p>
              </div>
              <button onClick={handleLogout} aria-label="Log out" className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"><LogOut size={17} /></button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
