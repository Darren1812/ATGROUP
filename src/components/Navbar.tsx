'use client';

import Image from "next/image";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from "@/components/ToastProvider";
import { useAuth } from "@/context/AuthContext"; // Import useAuth
import { Home, LogOut, Menu, X, ChevronDown } from "lucide-react";

export default function Navbar() {
  //              <h1 className="text-xl font-semibold text-slate-800 tracking-tight">MARKETING HUB</h1>
  const pathname = usePathname();
  const router = useRouter();
  const addToast = useToast();
  const { user, logout: authLogout } = useAuth(); // Get user and logout function from AuthContext
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const noNavbarRoutes = ['/', '/'];
  const showNavbar = !noNavbarRoutes.includes(pathname);

  const handleLogout = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Account/logout`,
        {
          method: "POST",
          credentials: "include", // send cookies
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userName: user?.name,   // <-- ADD THIS
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        addToast(data.message || "Logged out successfully", "success");
        authLogout(); // clear context
        router.replace("/"); // redirect
      } else {
        const errorData = await response.json();
        addToast(errorData.message || "Logout failed", "error");
      }
    } catch {
      addToast("An error occurred during logout.", "error");
    }
  };

  if (!showNavbar) {
    return null; // Don't render navbar on specified routes
  }

  const navItems = [
    { label: "Home", href: "/dashboard", icon: Home },
    { label: "BUTTON 2", href: "/page2" },
    { label: "BUTTON 3", href: "/ModelPage" },
    { label: "BUTTON 4", href: "/page4" },
  ];

  return (
    <nav className="bg-white shadow-md border-b border-slate-200 sticky top-0 z-50 backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex justify-between items-center">
          {/* Left Section: Logo + Title */}
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="flex items-center hover:opacity-80 transition-opacity">
              <Image
                src="/images/logo-top-panel-atgroup.png"
                alt="AT Group Logo"
                width={180}
                height={54}
                className="object-contain"
                priority
              />
            </Link>
            <div className="hidden lg:block w-px h-8 bg-slate-300" />
            <div className="hidden lg:block">

              <p className="text-xs text-slate-500">Management System</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={index}
                  href={item.href}
                  className={`group flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${isActive
                    ? 'bg-slate-800 text-white shadow-md'
                    : 'text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  {Icon && (
                    <Icon
                      size={18}
                      className={`transition-transform ${isActive ? '' : 'group-hover:scale-110'
                        }`}
                    />
                  )}
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* User Menu Dropdown */}
            <div className="relative ml-4">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-700 font-medium text-sm hover:bg-slate-100 transition-all duration-200 border border-slate-200"
              >
                <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="hidden xl:inline">{user?.name || 'User'}</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-200">
                    <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{user?.role || 'User'}</p>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-slate-200 space-y-2">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={index}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  {Icon && <Icon size={18} />}
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Mobile User Info */}
            <div className="px-4 py-3 bg-slate-50 rounded-lg mt-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{user?.department || 'User'}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors font-medium text-sm"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}