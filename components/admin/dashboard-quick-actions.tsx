"use client";

import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart2,
  CreditCard,
  Users,
  UserCog,
  MessageSquare,
  Settings,
  FileText,
  BellDot,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function DashboardQuickActions() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const adminActions = [
    {
      href: "/admin/view-reports",
      label: "Reports",
      icon: BarChart2,
    },
    {
      href: "/admin/payments",
      label: "Payments",
      icon: CreditCard,
    },
    {
      href: "/admin/view-attendance",
      label: "Attendance",
      icon: Users,
    },
    {
      href: "/admin/feedback",
      label: "Feedback",
      icon: MessageSquare,
    },
  ];

  const superAdminOnlyActions = [
    {
      href: "/admin/settings",
      label: "Settings",
      icon: Settings,
    },
    {
      href: "/admin/users",
      label: "Manage Admins",
      icon: UserCog,
    },
    {
      href: "/admin/audit-logs",
      label: "Audit Logs",
      icon: FileText,
    },
    {
      href: "/admin/notification-settings",
      label: "Notifications",
      icon: BellDot,
    },
  ];

  const allActions = isSuperAdmin 
    ? [...adminActions, ...superAdminOnlyActions]
    : adminActions;

  return (
    <Card className="rounded-2xl border-border">
      <CardContent className="p-4 md:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-3">
          {allActions.map((action) => {
            const Icon = action.icon;
            const isSuperAdminAction = superAdminOnlyActions.some(a => a.href === action.href);
            
            return (
              <Link
                key={action.href}
                href={action.href}
                className={cn(
                  "group relative flex flex-col items-center justify-center gap-2 p-3 md:p-4 rounded-lg",
                  "border border-border bg-background",
                  "hover:bg-accent hover:border-accent-foreground/20",
                  "transition-all duration-200",
                  "hover:shadow-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg",
                    "bg-muted group-hover:bg-primary/10",
                    "transition-colors duration-200",
                    isSuperAdminAction && "bg-primary/5"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 md:h-6 md:w-6",
                      "text-muted-foreground group-hover:text-primary",
                      "transition-colors duration-200",
                      isSuperAdminAction && "text-primary/70"
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-xs md:text-sm font-medium text-center",
                    "text-foreground group-hover:text-primary",
                    "transition-colors duration-200",
                    "line-clamp-2"
                  )}
                >
                  {action.label}
                </span>
                <ChevronRight
                  className={cn(
                    "absolute top-2 right-2 h-4 w-4",
                    "text-muted-foreground/0 group-hover:text-muted-foreground",
                    "transition-all duration-200",
                    "opacity-0 group-hover:opacity-100",
                    "translate-x-0 group-hover:translate-x-0.5"
                  )}
                />
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}