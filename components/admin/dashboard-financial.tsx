"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DashboardFinancialProps {
  financial: {
    totalDues: number;
    totalPayments: number;
    pendingDues: number;
    totalGuestExpense: number;
    totalBaseExpense: number;
    totalFines: number;
  };
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300"];

export function DashboardFinancial({ financial }: DashboardFinancialProps) {
  const formatCurrency = (value: number) => {
    return `Rs. ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Dues vs Payments comparison
  const duesVsPayments = [
    {
      name: "Dues",
      value: financial.totalDues,
      fill: "#ef4444", // red-500
    },
    {
      name: "Payments",
      value: financial.totalPayments,
      fill: "#22c55e", // green-500
    },
  ];

  // Expense breakdown
  const expenseBreakdown = [
    {
      name: "Base Expense",
      value: financial.totalBaseExpense,
      fill: "#3b82f6", // blue-500
    },
    {
      name: "Guest Expense",
      value: financial.totalGuestExpense,
      fill: "#f59e0b", // amber-500
    },
    {
      name: "Fines",
      value: financial.totalFines,
      fill: "#ef4444", // red-500
    },
  ].filter((item) => item.value > 0); // Only show expenses that exist

  // Month-to-date summary
  const netAmount = financial.totalPayments - financial.totalDues;
  const isPositive = netAmount >= 0;

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
          <CardDescription>Current month financial summary and breakdown</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Month-to-date Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Total Dues</span>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{formatCurrency(financial.totalDues)}</div>
              <p className="text-xs text-muted-foreground mt-1">Outstanding amount</p>
            </div>

            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Payments Received</span>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(financial.totalPayments)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Amount collected</p>
            </div>

            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Net Position</span>
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
              </div>
              <div
                className={`text-2xl font-bold ${
                  isPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-destructive"
                }`}
              >
                {formatCurrency(Math.abs(netAmount))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isPositive ? "Surplus" : "Deficit"}
              </p>
            </div>
          </div>

          {/* Dues vs Payments Comparison */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Dues vs Payments</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={duesVsPayments}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `Rs. ${(value / 1000).toFixed(0)}k`} />
                <RechartsTooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                />
                <Legend />
                <Bar dataKey="value" name="Amount" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Expense Breakdown */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Expense Breakdown</h3>
            {expenseBreakdown.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="flex flex-col justify-center gap-3">
                  {expenseBreakdown.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: item.fill }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <span className="text-sm font-semibold">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No expenses recorded for this month
              </div>
            )}
          </div>

          {/* Alerts */}
          {financial.pendingDues > 0 && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                    High Pending Dues
                  </span>
                  <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/30">
                    {formatCurrency(financial.pendingDues)}
                  </Badge>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  There are outstanding dues that need attention. Consider sending payment reminders to users.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
