"use client";

import { DashboardStatsComponent } from "@/components/admin/dashboard-stats";
import { DashboardChartsComponent } from "@/components/admin/dashboard-charts";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of attendance, users, and statistics
        </p>
      </div>

      <DashboardStatsComponent />
      <DashboardChartsComponent />
    </div>
  );
}
