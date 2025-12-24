"use client";

import { FeedbackManagement } from "@/components/admin/feedback-management";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAdminPermissions } from "@/lib/hooks/use-admin-permissions";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminFeedbackPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (user.role !== "admin" && user.role !== "super_admin") {
        router.replace("/user/dashboard");
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!permissionsLoading && user) {
      if (user.role === "admin" && !hasPermission("feedback")) {
        router.replace("/admin/dashboard");
      }
    }
  }, [user, hasPermission, permissionsLoading, router]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user || !(user.role === "admin" || user.role === "super_admin")) {
    return null;
  }

  return <FeedbackManagement />;
}
