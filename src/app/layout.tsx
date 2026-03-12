// 1. REMOVED "use client" - Root Layout should be a Server Component
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import React from "react";
import { ToastProvider } from "@/components/ToastProvider";
import Navbar from "@/components/Navbar"; 
import { AuthProvider } from "@/context/AuthContext"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Optional: Add metadata here since this is now a server component
export const metadata = {
  title: "AT Group",
  description: "Management Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-neutral-light text-neutral-dark`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main>{children}</main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}