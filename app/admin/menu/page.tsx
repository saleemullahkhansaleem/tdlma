"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Menu } from "@/lib/types/menu";
import { getAllMenus } from "@/lib/api/client";
import { MenuCard } from "@/components/admin/menu-card";
import { MenuEditModal } from "@/components/admin/menu-edit-modal";
import { Skeleton } from "@/components/ui/skeleton";

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

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-3">
          <Skeleton className="h-5 w-24" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Menu</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Week Even:</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DAYS.map((day) => (
            <MenuCard
              key={`even-${day}`}
              day={day}
              menu={getMenuForDay(day, "Even")}
              weekType="Even"
              onEdit={() => handleEdit(day, "Even")}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Week Odd:</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DAYS.map((day) => (
            <MenuCard
              key={`odd-${day}`}
              day={day}
              menu={getMenuForDay(day, "Odd")}
              weekType="Odd"
              onEdit={() => handleEdit(day, "Odd")}
            />
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
