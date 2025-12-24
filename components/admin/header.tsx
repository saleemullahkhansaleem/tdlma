"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "../theme-toggle";
import { TodayMenu } from "@/components/today-menu";
import { NotificationBell } from "@/components/admin/notification-bell";
import { User, LogOut, Menu } from "lucide-react";
import Link from "next/link";

interface AdminHeaderProps {
  onMenuClick?: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-30 shrink-0 bg-card backdrop-blur px-4 md:px-6">
      <div className="flex w-full items-center justify-between gap-4 h-14">
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          {onMenuClick && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="md:hidden"
              aria-label="Toggle menu"
            >
              <Menu className="size-5" />
            </Button>
          )}
          <TodayMenu imageSize={36} textSize="lg" />
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />
          <ThemeToggle size="icon" variant="ghost" />
          <div className="text-right text-sm leading-tight hidden md:block">
            <p className="font-medium">{user?.name ?? "Admin"}</p>
          </div>
          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  aria-label="User menu"
                  title="User menu"
                >
                  <Avatar
                    alt={user?.name}
                    fallback={user?.name?.[0] ?? "A"}
                    className="h-9 w-9"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 p-0 rounded-lg shadow-lg">
                <div className="flex items-center gap-3 p-2 border-b bg-muted/50">
                  <Avatar
                    alt={user?.name}
                    fallback={user?.name?.[0] ?? "A"}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold leading-tight truncate">{user?.name ?? "Admin"}</span>
                    <span className="text-xs text-muted-foreground truncate">{user?.email ?? "admin@example.com"}</span>
                  </div>
                </div>
                <DropdownMenuItem className="cursor-pointer mt-1" asChild>
                  <Link href="/admin/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive gap-2"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="User menu"
              disabled
            >
              <Avatar
                alt={user?.name}
                fallback={user?.name?.[0] ?? "A"}
                className="h-9 w-9"
              />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
