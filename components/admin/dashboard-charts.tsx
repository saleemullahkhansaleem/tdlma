"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getDashboardStats, DashboardStats, getSettings } from "@/lib/api/client";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300"];

export function DashboardChartsComponent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fineSettings, setFineSettings] = useState({
    fineAmountUnclosed: 0,
    fineAmountUnopened: 0,
  });

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const [statsData, settingsData] = await Promise.all([
        getDashboardStats(user, "week"),
        getSettings(user),
      ]);
      setStats(statsData);
      setFineSettings({
        fineAmountUnclosed: settingsData.fineAmountUnclosed,
        fineAmountUnopened: settingsData.fineAmountUnopened,
      });
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard charts");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="rounded-2xl">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
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

  // Prepare data for charts
  const attendanceTrends = stats.trends.map((trend) => ({
    date: format(new Date(trend.date), "MMM dd"),
    present: trend.present,
    absent: trend.absent,
    unclosed: trend.unclosed,
    unopened: trend.unopened,
  }));

  const userDistribution = [
    { name: "Employees", value: stats.employeeCount },
    { name: "Students", value: stats.studentCount },
  ];

  const attendanceComparison = [
    { name: "Present", value: stats.period.present },
    { name: "Absent", value: stats.period.absent },
    { name: "Unclosed", value: stats.period.unclosed },
    { name: "Unopened", value: stats.period.unopened },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Attendance Trends Line Chart */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Attendance Trends (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendanceTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="present"
                  stroke="#82ca9d"
                  name="Present"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="absent"
                  stroke="#ff7300"
                  name="Absent"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="unclosed"
                  stroke="#ffc658"
                  name="Unclosed"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="unopened"
                  stroke="#8884d8"
                  name="Unopened"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Type Distribution Pie Chart */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">User Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attendance Comparison Bar Chart */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Attendance Comparison (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fine Collection Chart */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Fine Collection Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  ${stats.period.totalFine.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Total fines collected in the last 7 days
                </p>
                <div className="mt-6 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Unclosed fines:</span>
                    <span className="font-medium">
                      ${(stats.period.unclosed * fineSettings.fineAmountUnclosed).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unopened fines:</span>
                    <span className="font-medium">
                      ${(stats.period.unopened * fineSettings.fineAmountUnopened).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
