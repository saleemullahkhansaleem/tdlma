"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getDashboardStats, DashboardStats } from "@/lib/api/client";
import { DashboardKPIs } from "@/components/admin/dashboard-kpis";
import { DashboardFinancial } from "@/components/admin/dashboard-financial";
import { DashboardOperational } from "@/components/admin/dashboard-operational";
import { DashboardFeedback } from "@/components/admin/dashboard-feedback";
import { DashboardQuickActions } from "@/components/admin/dashboard-quick-actions";
import { DashboardChartsComponent } from "@/components/admin/dashboard-charts";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getDashboardStats(user, "today");
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>

        {/* KPI Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="rounded-2xl">
              <CardContent className="p-4">
                <Skeleton className="h-12 w-full mb-2" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions Skeleton */}
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section Skeletons */}
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="rounded-2xl">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of attendance, users, and statistics
          </p>
        </div>

        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-destructive mb-1">Error loading dashboard</h3>
            <p className="text-sm text-destructive/80">{error}</p>
            <button
              onClick={loadStats}
              className="mt-3 text-sm text-destructive underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of attendance, users, and statistics
          </p>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of attendance, users, financial metrics, and statistics
        </p>
      </div>

      {/* Quick Actions */}
      <DashboardQuickActions />

      {/* KPI Summary Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Key Performance Indicators</h2>
        <DashboardKPIs stats={stats} />
      </div>

      {/* Financial Overview */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Financial Overview</h2>
        <DashboardFinancial financial={stats.financial} />
      </div>

      {/* Operational Insights */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Operational Insights</h2>
        <DashboardOperational operational={stats.operational} />
      </div>

      {/* Feedback & Alerts */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Feedback & Alerts</h2>
        <DashboardFeedback feedback={stats.feedback} />
      </div>

      {/* Charts */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Attendance Trends & Analytics</h2>
        <DashboardChartsComponent />
      </div>
    </div>
  );
}