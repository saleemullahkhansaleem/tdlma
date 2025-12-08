"use client";

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
import { User, LogOut } from "lucide-react";
import Link from "next/link";

export function AdminHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 shrink-0 bg-muted/80 backdrop-blur px-4 md:px-6">
      <div className="flex w-full items-center justify-between gap-4 h-14">
        <div className="flex items-center gap-3">
          <TodayMenu imageSize={32} textSize="lg" />
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle size="icon" variant="ghost" />
          <div className="text-right text-sm leading-tight">
            <p className="font-medium">{user?.name ?? "Admin"}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full"
              >
                <Avatar
                  alt={user?.name}
                  fallback={user?.name?.[0] ?? "A"}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href="/admin/settings" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
