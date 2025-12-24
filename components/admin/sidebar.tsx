"use client";

import Link from "next/link";
import Image from "next/image";
import {
  LayoutGrid,
  UtensilsCrossed,
  CheckSquare,
  Users,
  BarChart2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  UserCog,
  User,
  FileText,
  CreditCard,
  Send,
  Bell,
  Calendar,
  BellDot,
  UserPlus,
  Shield,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useAdminPermissions } from "@/lib/hooks/use-admin-permissions";
import { getModuleFromRoute } from "@/lib/utils/permissions";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutGrid, module: "dashboard" },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed, module: "menu" },
  { href: "/admin/mark-attendance", label: "Mark Attendance", icon: CheckSquare, module: "mark_attendance" },
  { href: "/admin/view-attendance", label: "View Attendance", icon: Users, module: "view_attendance" },
  { href: "/admin/guests", label: "Guest Management", icon: UserPlus, module: "guests" },
  { href: "/admin/view-reports", label: "View Reports", icon: BarChart2, module: "view_reports" },
  { href: "/admin/payments", label: "Payments", icon: CreditCard, module: "payments" },
  { href: "/admin/off-days", label: "Off Days", icon: Calendar, module: "off_days" },
  { href: "/admin/feedback", label: "Feedback Management", icon: MessageSquare, module: "feedback" },
  // { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/send-notifications", label: "Send Notifications", icon: Send, module: "send_notifications" },
  { href: "/admin/settings", label: "Settings", icon: Settings, module: "settings" },
];

const superAdminNavItems = [
  { href: "/admin/users", label: "Users", icon: UserCog },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: FileText },
  { href: "/admin/notification-settings", label: "Notification Settings", icon: BellDot },
  { href: "/admin/permissions", label: "Permission Management", icon: Shield },
];

export function AdminSidebar({
  pathname,
  onNavigate,
  disableCollapse = false,
}: {
  pathname: string | null;
  onNavigate?: () => void;
  disableCollapse?: boolean;
}) {
  const { logout, user } = useAuth();
  const { isCollapsed, toggleCollapsed } = useSidebar();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();

  // Force non-collapsed state in mobile
  const effectiveCollapsed = disableCollapse ? false : isCollapsed;

  const isSuperAdmin = user?.role === "super_admin";
  
  // Filter nav items based on permissions for regular admins
  const filteredNavItems = isSuperAdmin
    ? navItems
    : navItems.filter((item) => {
        if (!item.module) return true; // Items without module are always shown
        return hasPermission(item.module as any);
      });

  const allNavItems = isSuperAdmin
    ? [...filteredNavItems, ...superAdminNavItems]
    : filteredNavItems;

  return (
    <Sidebar className={disableCollapse ? "w-64" : undefined}>
      <SidebarHeader>
        <Link href="/admin/dashboard" className="flex w-full items-center gap-2" tabIndex={-1}>
          <Image
            src="/logo.svg"
            alt="TDLMA"
            width={32}
            height={32}
            className="shrink-0"
          />
          {!effectiveCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-primary leading-tight">
                TD-LMA
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                Lunch Management
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {allNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname?.startsWith(item.href);
            return (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} onClick={onNavigate} className="block">
                  <SidebarMenuButton
                    isActive={active}
                    tooltip={item.label}
                    className={disableCollapse ? "w-full justify-start px-3" : "w-full"}
                  >
                    <Icon className="size-4 shrink-0" />
                    {!effectiveCollapsed && <span>{item.label}</span>}
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/admin/profile" onClick={onNavigate} className="block">
              <SidebarMenuButton
                isActive={pathname?.startsWith("/admin/profile")}
                tooltip="Profile"
                className={disableCollapse ? "w-full justify-start px-3" : "w-full"}
              >
                <User className="size-4 shrink-0" />
                {!effectiveCollapsed && <span>Profile</span>}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuAction
              onClick={logout}
              tooltip="Logout"
              className={disableCollapse
                ? "text-destructive hover:bg-destructive/10 focus:text-destructive focus:bg-destructive/10 justify-start px-3"
                : "text-destructive hover:bg-destructive/10 focus:text-destructive focus:bg-destructive/10"
              }
            >
              <LogOut className="size-4 shrink-0 text-destructive" />
              {!effectiveCollapsed && <span className="text-destructive">Logout</span>}
            </SidebarMenuAction>
          </SidebarMenuItem>
          {/* Hide collapse button in mobile view */}
          {!disableCollapse && (
            <SidebarMenuItem className="mt-2 pt-2 border-t">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapsed}
                className="w-full h-9 flex items-center text-muted-foreground"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <ChevronRight className="size-4" />
                ) : (
                  <>
                    <ChevronLeft className="size-4" />
                    {!isCollapsed && <span className="text-xs">Collapse sidebar</span>}
                  </>
                )}
              </Button>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
