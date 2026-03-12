'use client';

import React, { useState } from "react";
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import Image from "next/image";

const LoginPage: React.FC = () => {
  const [nameUse, setNameUse] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Added loading state
  const router = useRouter();
  const addToast = useToast();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Account/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameUse, password }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          addToast(data.message, 'success');
          login(data.user);
          router.push('/dashboard');
        } else {
          addToast(data.reminder || 'Login failed', 'error');
        }
      } else {
        const errorData = await response.json();
        addToast(errorData.message || 'Login failed', 'error');
      }
    } catch (error) {
      console.error('Error during login:', error);
      addToast('An error occurred during login.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-100 px-4">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur-md shadow-xl border border-white rounded-3xl p-10 flex flex-col items-center transition-all"
        >
          {/* 🖼 Logo Section */}
          <div className="mb-8 transition-transform hover:scale-105 duration-300">
            <Image
              src="/images/logo-top-panel-atgroup.png"
              alt="AT Group Logo"
              width={240}
              height={80}
              className="object-contain"
              priority
            />
          </div>

          <div className="w-full text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
            <p className="text-gray-500 text-sm mt-1">Please enter your details to sign in</p>
          </div>

          {/* Input: Name */}
          <div className="mb-5 w-full">
            <label className="block text-gray-600 mb-1.5 text-xs font-semibold uppercase tracking-wider ml-1">
              Username
            </label>
            <input
              type="text"
              value={nameUse}
              onChange={(e) => setNameUse(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-800"
              placeholder="e.g. johndoe"
              required
            />
          </div>

          {/* Input: Password */}
          <div className="mb-8 w-full">
            <label className="block text-gray-600 mb-1.5 text-xs font-semibold uppercase tracking-wider ml-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-800"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-200 hover:shadow-blue-300 transform active:scale-[0.98] transition-all flex justify-center items-center"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              "Sign In"
            )}
          </button>

          <p className="mt-8 text-xs text-gray-400">
            © {new Date().getFullYear()} AT Group. All rights reserved.
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;