"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getDashboardStats, DashboardStats } from "@/lib/api/client";
import { StatsCard } from "@/components/admin/stats-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function DashboardStatsComponent() {
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
        <section className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="rounded-2xl">
                <CardContent className="p-4">
                  <Skeleton className="h-12 w-full mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        <section className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="rounded-2xl">
                <CardContent className="p-4">
                  <Skeleton className="h-12 w-full mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Expectations:</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard
            label="Total Consumers"
            value={stats.totalUsers.toString()}
          />
          <StatsCard
            label="Meals Booked Today"
            value={stats.today.mealsBooked.toString()}
          />
          <StatsCard
            label="Meals Closed Today"
            value={stats.today.mealsClosed.toString()}
          />
          <StatsCard
            label="Total Loss"
            value={stats.today.totalLoss.toString()}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Reality:</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard
            label="Total Present"
            value={stats.today.present.toString()}
          />
          <StatsCard
            label="Total Absent"
            value={stats.today.absent.toString()}
          />
          <StatsCard
            label="Total Unclosed"
            value={stats.today.unclosed.toString()}
          />
          <StatsCard
            label="Total Unopened"
            value={stats.today.unopened.toString()}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">User Distribution:</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            label="Total Users"
            value={stats.totalUsers.toString()}
          />
          <StatsCard
            label="Employees"
            value={stats.employeeCount.toString()}
          />
          <StatsCard
            label="Students"
            value={stats.studentCount.toString()}
          />
        </div>
      </section>
    </div>
  );
}
