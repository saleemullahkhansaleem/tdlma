"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  UtensilsCrossed,
  CheckSquare,
  Users,
  BarChart2,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/mark-attendance", label: "Mark Attendance", icon: CheckSquare },
  { href: "/admin/view-attendance", label: "View Attendance", icon: Users },
  { href: "/admin/view-reports", label: "View Reports", icon: BarChart2 },
];

export function Sidebar({
  pathname,
  onNavigate,
}: {
  pathname: string | null;
  onNavigate?: () => void;
}) {
  const { logout } = useAuth();

  return (
    <div className="flex h-full flex-col justify-between bg-card">
      <div className="px-6 pt-6">
        <div className="flex items-center gap-2 mb-8">
          <Image src="/logo.svg" alt="TDLMA" width={32} height={32} />
          <span className="text-xl font-semibold text-primary leading-none">
            Logo
          </span>
        </div>

        <nav className="space-y-1 text-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary border-l-4 border-primary"
                    : "text-muted-foreground hover:bg-muted/60",
                )}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-6 pb-6 space-y-2 text-sm text-muted-foreground">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-full px-3 py-2.5 hover:bg-muted/60"
        >
          <Settings className="size-4" />
          <span>Settings</span>
        </button>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-full px-3 py-2.5 hover:bg-muted/60"
        >
          <LogOut className="size-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
