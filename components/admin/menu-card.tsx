"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Menu, MenuItem } from "@/lib/types/menu";
import { Badge } from "../ui/badge";
import { Edit, Plus } from "lucide-react";

interface MenuCardProps {
  day: string;
  menu: Menu | null;
  weekType: "Even" | "Odd";
  onEdit: () => void;
}

export function MenuCard({ day, menu, weekType, onEdit }: MenuCardProps) {
  const menuItem: MenuItem | null =
    menu?.menuItems && menu.menuItems.length > 0 ? menu.menuItems[0] : null;

  return (
    <Card className="border-secondary">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1.5 text-sm">
            <Badge
              variant="soft"
              className="rounded-full text-xs font-semibold"
            >
              {day}
            </Badge>
            <p className={`font-semibold text-base ${menuItem?.name ? "text-foreground" : "text-muted-foreground italic"}`}>
              {menuItem?.name || "Not set"}
            </p>
          </div>
          {menuItem?.imageUrl ? (
            <Image
              src={menuItem.imageUrl}
              alt={menuItem.name || "Menu"}
              width={64}
              height={64}
              className="rounded-full border border-border object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-full border border-border bg-muted flex items-center justify-center">
              <span className="text-xs text-muted-foreground">No image</span>
            </div>
          )}
        </div>
        {/* Import Lucide Icons at the top of your file:
            import { Plus, Pencil } from "lucide-react";
        */}
        <Button
          onClick={onEdit}
          size="sm"
          className="self-start mt-1"
        >
          {menuItem ? (
            <>
              <Edit className="w-4 h-4" />
              Edit
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add Menu
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
