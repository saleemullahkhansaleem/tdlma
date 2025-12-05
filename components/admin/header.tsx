"use client";

import { useAuth } from "@/lib/auth-context";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "../theme-toggle";
import { TodayMenu } from "@/components/today-menu";

export function AdminHeader() {
  const { user } = useAuth();

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
          <Avatar
            alt={user?.name}
            fallback={user?.name?.[0] ?? "A"}
          />
        </div>
      </div>
    </header>
  );
}
