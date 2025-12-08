"use client";

import { FeedbackManagement } from "@/components/admin/feedback-management";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminFeedbackPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (user.role !== "admin" && user.role !== "super_admin") {
        router.replace("/user/dashboard");
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user || !(user.role === "admin" || user.role === "super_admin")) {
    return null;
  }

  return (
    <FeedbackManagement />
  );
}
