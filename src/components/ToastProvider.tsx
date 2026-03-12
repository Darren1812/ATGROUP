"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// Type for a single toast
interface ToastItem {
  id: number;
  message: string;
  type?: "success" | "error";
  duration?: number;
}

// Context type
interface ToastContextType {
  addToast: (
    message: string,
    type?: "success" | "error",
    duration?: number
  ) => void;
}

// Create Context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast Provider
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (
    message: string,
    type: "success" | "error" = "success",
    duration = 3000
  ) => {
    const id = Date.now(); // simple unique ID
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`relative flex items-center px-6 py-4 rounded-lg shadow-lg text-white transition-transform transform text-sm
              ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}
            `}
            style={{
              animation: `slide-in 0.3s, slide-out 0.3s ${
                toast.duration! - 200
              }ms forwards`,
              minWidth: "280px", // wider box
              maxWidth: "360px", // prevent it from being too wide
              fontSize: "0.85rem", // smaller font
            }}
          >
            {/* Left accent bar */}
            <div
              className={`absolute left-0 top-0 h-full w-1 rounded-l-lg 
                ${toast.type === "success" ? "bg-green-700" : "bg-red-700"}
              `}
            />
            <span className="ml-2">{toast.message}</span>

            <style jsx>{`
              @keyframes slide-in {
                from {
                  transform: translateX(100%);
                  opacity: 0;
                }
                to {
                  transform: translateX(0);
                  opacity: 1;
                }
              }
              @keyframes slide-out {
                from {
                  transform: translateX(0);
                  opacity: 1;
                }
                to {
                  transform: translateX(100%);
                  opacity: 0;
                }
              }
            `}</style>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context.addToast;
};
