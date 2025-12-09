"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function UserLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // If not authenticated, middleware will handle redirect
    if (!user) {
      return;
    }

    // Prevent admin/super_admin from accessing user routes
    if (user.role === "admin" || user.role === "super_admin") {
      router.replace("/admin/dashboard");
    }
  }, [user, loading, router]);

  // Show nothing while checking (middleware handles the actual protection)
  if (loading) {
    return null;
  }

  // If user is admin, don't render (will redirect)
  if (user && (user.role === "admin" || user.role === "super_admin")) {
    return null;
  }

  return <>{children}</>;
}
