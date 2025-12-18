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
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
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
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/mark-attendance", label: "Mark Attendance", icon: CheckSquare },
  { href: "/admin/view-attendance", label: "View Attendance", icon: Users },
  { href: "/admin/view-reports", label: "View Reports", icon: BarChart2 },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/feedback", label: "Feedback Management", icon: MessageSquare },
  { href: "/admin/notifications", label: "Send Notifications", icon: Send },
];

const superAdminNavItems = [
  { href: "/admin/users", label: "Users", icon: UserCog },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: FileText },
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

  // Force non-collapsed state in mobile
  const effectiveCollapsed = disableCollapse ? false : isCollapsed;

  const isSuperAdmin = user?.role === "super_admin";
  const allNavItems = isSuperAdmin ? [...navItems, ...superAdminNavItems] : navItems;

  return (
    <Sidebar className={disableCollapse ? "w-64" : undefined}>
      <SidebarHeader>
        <div className="flex w-full items-center gap-2">
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
        </div>
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
            <Link href="/admin/settings" onClick={onNavigate} className="block">
              <SidebarMenuButton
                isActive={pathname?.startsWith("/admin/settings")}
                tooltip="Settings"
                className={disableCollapse ? "w-full justify-start px-3" : "w-full"}
              >
                <Settings className="size-4 shrink-0" />
                {!effectiveCollapsed && <span>Settings</span>}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
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
