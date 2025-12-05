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
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Feedback Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View, filter, and respond to user feedback, suggestions, and complaints
        </p>
      </div>
      <FeedbackManagement />
    </div>
  );
}
