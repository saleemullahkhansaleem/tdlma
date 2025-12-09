"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Menu } from "@/lib/types/menu";
import { getAllMenus } from "@/lib/api/client";
import { MenuCard } from "@/components/admin/menu-card";
import { MenuEditModal } from "@/components/admin/menu-edit-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, UtensilsCrossed, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const DAYS: ("Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday")[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function AdminMenuPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedWeekType, setSelectedWeekType] = useState<"Even" | "Odd">("Even");
  const [modalOpen, setModalOpen] = useState(false);

  const loadMenus = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getAllMenus(user);
      setMenus(data);
    } catch (err: any) {
      setError(err.message || "Failed to load menus");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenus();
  }, [user]);

  const getMenuForDay = (day: string, weekType: "Even" | "Odd"): Menu | null => {
    return (
      menus.find(
        (m) => m.dayOfWeek === day && m.weekType === weekType
      ) || null
    );
  };

  const handleEdit = (day: string, weekType: "Even" | "Odd") => {
    const menu = getMenuForDay(day, weekType);
    setSelectedMenu(menu);
    setSelectedDay(day);
    setSelectedWeekType(weekType);
    setModalOpen(true);
  };

  const handleSuccess = () => {
    loadMenus();
  };

  // Count menus for stats
  const evenWeekMenus = menus.filter((m) => m.weekType === "Even").length;
  const oddWeekMenus = menus.filter((m) => m.weekType === "Odd").length;
  const totalMenus = menus.length;

  // Skeleton component for menu cards
  const MenuCardSkeleton = () => (
    <Card className="border-secondary">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1.5 text-sm flex-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-16 w-16 rounded-full shrink-0" />
        </div>
        <Skeleton className="h-8 w-full rounded-full" />
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
            Menu Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage menu items for Even and Odd weeks across all days
          </p>
          {!loading && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
              <span>
                Total: <span className="font-semibold text-foreground">{totalMenus}</span> menus
              </span>
              <span className="text-primary">
                Even Week: <span className="font-semibold">{evenWeekMenus}</span>
              </span>
              <span className="text-secondary">
                Odd Week: <span className="font-semibold">{oddWeekMenus}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      )}

      {/* Week Even Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Even Week</h3>
          </div>
          {loading ? (
            <Skeleton className="h-5 w-12 rounded-full" />
          ) : (
            <Badge variant="default" className="rounded-full">
              {evenWeekMenus} / {DAYS.length}
            </Badge>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DAYS.map((day) => (
            <div key={`even-${day}`}>
              {loading ? (
                <MenuCardSkeleton />
              ) : (
                <MenuCard
                  day={day}
                  menu={getMenuForDay(day, "Even")}
                  weekType="Even"
                  onEdit={() => handleEdit(day, "Even")}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Week Odd Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-secondary" />
            <h3 className="text-lg font-semibold">Odd Week</h3>
          </div>
          {loading ? (
            <Skeleton className="h-5 w-12 rounded-full" />
          ) : (
            <Badge variant="soft" className="rounded-full">
              {oddWeekMenus} / {DAYS.length}
            </Badge>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DAYS.map((day) => (
            <div key={`odd-${day}`}>
              {loading ? (
                <MenuCardSkeleton />
              ) : (
                <MenuCard
                  day={day}
                  menu={getMenuForDay(day, "Odd")}
                  weekType="Odd"
                  onEdit={() => handleEdit(day, "Odd")}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      <MenuEditModal
        menu={selectedMenu}
        dayOfWeek={selectedDay}
        weekType={selectedWeekType}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
