"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
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

interface TodayMenuProps {
  showDate?: boolean;
  imageSize?: number;
  textSize?: "sm" | "md" | "lg" | "xl" | "2xl";
  dateFormat?: Intl.DateTimeFormatOptions;
}

export function TodayMenu({
  showDate = true,
  imageSize = 32,
  textSize = "lg",
  dateFormat = {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  },
}: TodayMenuProps) {
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

  const today = new Date();
  const dayOfWeek = getDayOfWeek(today);
  const isSunday = !dayOfWeek;

  const menuItem = todayMenu?.menuItems?.[0];
  const menuName = menuItem?.name || "Not set";
  const menuImage = menuItem?.imageUrl || "/logo.png";
  const todayDate = new Date().toLocaleDateString("en-GB", dateFormat);

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
  };

  return (
    <div className="flex flex-col">
      {showDate && (
        <span className={`text-xs text-muted-foreground`}>
          {todayDate}
        </span>
      )}
      {loading ? (
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton
            className="rounded-full"
            style={{ width: imageSize, height: imageSize }}
          />
        </div>
      ) : isSunday ? (
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${textSizeClasses[textSize]} text-muted-foreground italic`}>
            No meal today
          </span>
          <div
            className="rounded-full border border-border bg-muted flex items-center justify-center"
            style={{ width: imageSize, height: imageSize }}
          >
            <span className="text-xs text-muted-foreground">☀️</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${textSizeClasses[textSize]}`}>
            {menuName}
          </span>
          <Image
            src={menuImage}
            alt={menuName}
            width={imageSize}
            height={imageSize}
            className="rounded-full border border-border object-cover"
          />
        </div>
      )}
    </div>
  );
}
