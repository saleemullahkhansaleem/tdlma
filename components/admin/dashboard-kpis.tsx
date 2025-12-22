"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  HelpCircle,
  Users,
  UserCheck,
  UserX,
  DollarSign,
  CreditCard,
  AlertCircle,
  UsersRound,
  Receipt,
  Building2,
  AlertTriangle,
} from "lucide-react";

export interface KPICardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  tooltip?: string;
  variant?: "default" | "success" | "warning" | "danger";
  visible?: boolean;
  formatCurrency?: boolean;
}

export function KPICard({
  label,
  value,
  icon,
  tooltip,
  variant = "default",
  visible = true,
  formatCurrency = false,
}: KPICardProps) {
  if (!visible) return null;

  const formatValue = (val: string | number): string => {
    if (formatCurrency) {
      const num = typeof val === "string" ? parseFloat(val) : val;
      return `Rs. ${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return typeof val === "number" ? val.toLocaleString("en-IN") : val;
  };

  const variantClasses = {
    default: "bg-secondary text-secondary-foreground",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
    danger: "bg-destructive/10 text-destructive border border-destructive/20",
  };

  return (
    <Card className="rounded-2xl border border-border shadow-sm">
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between mb-1">
          {icon && (
            <div className="text-muted-foreground flex items-center">
              {icon}
            </div>
          )}
          {tooltip && (
            <div className="group relative ml-auto">
              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-popover border border-border rounded-md shadow-lg text-xs text-popover-foreground opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                {tooltip}
              </div>
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex items-center justify-center rounded-lg py-3 text-2xl font-semibold",
            variantClasses[variant]
          )}
        >
          {formatValue(value)}
        </div>
        <p className="text-xs text-center text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

interface DashboardKPIsProps {
  stats: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    financial: {
      totalDues: number;
      totalPayments: number;
      pendingDues: number;
      guestCount: number;
      totalGuestExpense: number;
      totalBaseExpense: number;
      totalFines: number;
    };
  };
}

export function DashboardKPIs({ stats }: DashboardKPIsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
      <KPICard
        label="Total Users"
        value={stats.totalUsers}
        icon={<Users className="h-5 w-5" />}
        tooltip="Total number of users in the system (both active and inactive)"
      />
      <KPICard
        label="Active Users"
        value={stats.activeUsers}
        icon={<UserCheck className="h-5 w-5" />}
        variant="success"
        tooltip="Number of users currently active in the system"
      />
      <KPICard
        label="Inactive Users"
        value={stats.inactiveUsers}
        icon={<UserX className="h-5 w-5" />}
        variant="warning"
        tooltip="Number of users currently inactive"
      />
      <KPICard
        label="Total Dues (Current Month)"
        value={stats.financial.totalDues}
        icon={<DollarSign className="h-5 w-5" />}
        formatCurrency
        variant={stats.financial.totalDues > 0 ? "danger" : "default"}
        tooltip="Total outstanding dues across all users for the current month (base expense + guest expenses + fines - payments)"
      />
      <KPICard
        label="Total Payments Received"
        value={stats.financial.totalPayments}
        icon={<CreditCard className="h-5 w-5" />}
        formatCurrency
        variant="success"
        tooltip="Total payments received from all users in the current month"
      />
      <KPICard
        label="Pending Dues"
        value={stats.financial.pendingDues}
        icon={<AlertCircle className="h-5 w-5" />}
        formatCurrency
        variant={stats.financial.pendingDues > 0 ? "warning" : "success"}
        tooltip="Outstanding dues that need to be collected from users"
      />
      <KPICard
        label="Guest Count (Current Month)"
        value={stats.financial.guestCount}
        icon={<UsersRound className="h-5 w-5" />}
        tooltip="Total number of guests added in the current month"
      />
      <KPICard
        label="Total Guest Expense"
        value={stats.financial.totalGuestExpense}
        icon={<Receipt className="h-5 w-5" />}
        formatCurrency
        tooltip="Total expenses incurred from guest meals in the current month"
      />
      <KPICard
        label="Total Base Expense"
        value={stats.financial.totalBaseExpense}
        icon={<Building2 className="h-5 w-5" />}
        formatCurrency
        tooltip="Total base monthly expenses calculated for all active users in the current month"
      />
      <KPICard
        label="Total Fines"
        value={stats.financial.totalFines}
        icon={<AlertTriangle className="h-5 w-5" />}
        formatCurrency
        variant={stats.financial.totalFines > 0 ? "warning" : "default"}
        tooltip="Total fines collected from users in the current month"
      />
    </div>
  );
}
