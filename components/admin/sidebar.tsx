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
  { href: "/admin/feedback", label: "Feedback Management", icon: MessageSquare },
];

const superAdminNavItems = [
  { href: "/admin/users", label: "Users", icon: UserCog },
];

export function AdminSidebar({
  pathname,
  onNavigate,
}: {
  pathname: string | null;
  onNavigate?: () => void;
}) {
  const { logout, user } = useAuth();
  const { isCollapsed, toggleCollapsed } = useSidebar();

  const isSuperAdmin = user?.role === "super_admin";
  const allNavItems = isSuperAdmin ? [...navItems, ...superAdminNavItems] : navItems;

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex w-full items-center gap-2">
          <Image
            src="/logo.svg"
            alt="TDLMA"
            width={32}
            height={32}
            className="shrink-0"
          />
          {!isCollapsed && (
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
                    className="w-full"
                  >
                    <Icon className="size-4 shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
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
            <Link href="/admin/settings" className="block">
              <SidebarMenuAction tooltip="Settings">
                <Settings className="size-4 shrink-0" />
                {!isCollapsed && <span>Settings</span>}
              </SidebarMenuAction>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuAction onClick={logout} tooltip="Logout">
              <LogOut className="size-4 shrink-0" />
              {!isCollapsed && <span>Logout</span>}
            </SidebarMenuAction>
          </SidebarMenuItem>
          <SidebarMenuItem className="mt-2 pt-2 border-t">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapsed}
              className="w-full h-9"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="size-4" />
              ) : (
                <ChevronLeft className="size-4" />
              )}
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
