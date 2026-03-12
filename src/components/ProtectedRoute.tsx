"use client";
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // if no user in context → redirect to login
    if (!user) {
      router.replace("/");
    }
  }, [user, router]);

  // while context still loading, prevent flicker
  if (!user) {
    return null; // or loading spinner
  }

  return <>{children}</>;
}
