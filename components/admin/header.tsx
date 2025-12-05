"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "../theme-toggle";
import { getAllMenus } from "@/lib/api/client";
import { Menu, DayOfWeek, WeekType } from "@/lib/types/menu";
import { Skeleton } from "@/components/ui/skeleton";

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getDayOfWeek(date: Date): DayOfWeek | null {
  const dayIndex = date.getDay();
  // Sunday is 0, Monday is 1, etc.
  if (dayIndex === 0) return null; // Sunday - no menu
  const days: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayIndex - 1] || null;
}

function getWeekType(date: Date): WeekType {
  const weekNumber = getWeekNumber(date);
  return weekNumber % 2 === 0 ? "Even" : "Odd";
}

export function AdminHeader() {
  const { user } = useAuth();
  const [todayMenu, setTodayMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTodayMenu = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const today = new Date();
        const dayOfWeek = getDayOfWeek(today);

        if (!dayOfWeek) {
          // Sunday - no menu
          setTodayMenu(null);
          setLoading(false);
          return;
        }

        const weekType = getWeekType(today);

        const menus = await getAllMenus(user, {
          dayOfWeek: dayOfWeek || undefined,
          weekType,
        });

        const menu = menus.find(
          (m) => m.dayOfWeek === dayOfWeek && m.weekType === weekType
        );

        setTodayMenu(menu || null);
      } catch (error) {
        console.error("Failed to load today's menu:", error);
        setTodayMenu(null);
      } finally {
        setLoading(false);
      }
    };

    loadTodayMenu();
  }, [user]);

  const menuItem = todayMenu?.menuItems?.[0];
  const menuName = menuItem?.name || "Not set";
  const menuImage = menuItem?.imageUrl || "/logo.png";

  return (
    <header className="sticky top-0 z-30 shrink-0 bg-muted/80 backdrop-blur px-4 md:px-6">
      <div className="flex w-full items-center justify-between gap-4 h-14">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
            {loading ? (
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">{menuName}</span>
                <Image
                  src={menuImage}
                  alt={menuName}
                  width={32}
                  height={32}
                  className="rounded-full border border-border object-cover"
                />
              </div>
            )}
          </div>
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
