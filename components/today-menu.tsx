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
  imageSize = 36,
  textSize = "lg",
  dateFormat = {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  },
}: TodayMenuProps) {
  const { user, loading: authLoading } = useAuth();
  const [todayMenu, setTodayMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTodayMenu = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        setLoading(true);
        return;
      }

      if (!user) {
        setLoading(false);
        setTodayMenu(null);
        return;
      }

      setLoading(true);

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
  }, [user, authLoading]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const today = new Date();
  const dayOfWeek = getDayOfWeek(today);
  const isSunday = !dayOfWeek;

  const menuItem = todayMenu?.menuItems?.[0];
  const menuName = menuItem?.name;
  const menuImage = menuItem?.imageUrl || "/logo.png";

  // Format date only on client to avoid hydration mismatch
  const todayDate = mounted
    ? new Date().toLocaleDateString("en-GB", dateFormat)
    : "";

  const textSizeClasses = {
    sm: "text-xs sm:text-sm",
    md: "text-sm sm:text-base",
    lg: "text-base sm:text-lg",
    xl: "text-lg sm:text-xl",
    "2xl": "text-xl sm:text-2xl",
  };

  // Responsive image size: smaller on mobile, full size on desktop
  // Using CSS custom properties for responsive sizing
  const imageSizeRatio = imageSize / 36; // Default is 36
  const mobileImageSize = Math.round(28 * imageSizeRatio);

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3 w-full" title="Today's Menu">
      {/* Left side: Date and Menu Name */}
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        {showDate && mounted && (
          <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
            {todayDate}
          </span>
        )}
        {showDate && !mounted && (
          <Skeleton className="h-2.5 sm:h-3 w-20 sm:w-24" />
        )}
        {loading ? (
          <Skeleton
            className={`${textSize === "sm" ? "h-3 sm:h-4" :
              textSize === "md" ? "h-4 sm:h-5" :
                textSize === "lg" ? "h-5 sm:h-6" :
                  textSize === "xl" ? "h-6 sm:h-7" :
                    "h-7 sm:h-8"
              } w-24 sm:w-32`}
          />
        ) : isSunday ? (
          <span className={`font-semibold ${textSizeClasses[textSize]} text-muted-foreground italic leading-tight`}>
            No meal today
          </span>
        ) : menuName ? (
          <span className={`font-semibold ${textSizeClasses[textSize]} leading-tight truncate`}>
            {menuName}
          </span>
        ) : (
          <span className={`font-semibold ${textSizeClasses[textSize]} text-muted-foreground italic leading-tight`}>
            Not set
          </span>
        )}
      </div>

      {/* Right side: Image - Responsive sizing */}
      <div 
        className="today-menu-image shrink-0"
        style={{
          width: `${mobileImageSize}px`,
          height: `${mobileImageSize}px`,
        }}
      >
        {loading ? (
          <Skeleton
            className="rounded-full w-full h-full"
          />
        ) : isSunday ? (
          <div className="rounded-full border border-border bg-muted flex items-center justify-center shadow-sm w-full h-full">
            <span className="text-[10px] sm:text-xs text-muted-foreground">☀️</span>
          </div>
        ) : menuName ? (
          <Image
            src={menuImage}
            alt={menuName}
            width={imageSize}
            height={imageSize}
            className="rounded-full border border-border object-cover shadow-sm w-full h-full"
          />
        ) : (
          <div className="rounded-full border border-border bg-muted flex items-center justify-center shadow-sm w-full h-full">
            <span className="text-[10px] sm:text-xs text-muted-foreground">📋</span>
          </div>
        )}
      </div>
      <style jsx>{`
        .today-menu-image {
          width: ${mobileImageSize}px;
          height: ${mobileImageSize}px;
        }
        @media (min-width: 640px) {
          .today-menu-image {
            width: ${imageSize}px;
            height: ${imageSize}px;
          }
        }
      `}</style>
    </div>
  );
}
