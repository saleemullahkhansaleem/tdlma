"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Menu, MenuItem, UpdateMenuDto, CreateMenuDto } from "@/lib/types/menu";
import { createMenu, updateMenu } from "@/lib/api/client";
import { useAuth } from "@/lib/auth-context";
import { Label } from "../ui/label";

interface MenuEditModalProps {
  menu: Menu | null;
  dayOfWeek: string;
  weekType: "Even" | "Odd";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AVAILABLE_IMAGES = [
  { name: "Biryani", url: "/menu/biryani.png" },
  { name: "Daal Channa", url: "/menu/daal-channa.png" },
  { name: "Daal Mash", url: "/menu/daal-mash.png" },
  { name: "Haleem", url: "/menu/haleem.png" },
  { name: "Nihari", url: "/menu/nihari.png" },
  { name: "Pulao", url: "/menu/pulao.png" },
];

export function MenuEditModal({
  menu,
  dayOfWeek,
  weekType,
  open,
  onOpenChange,
  onSuccess,
}: MenuEditModalProps) {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuItem, setMenuItem] = useState<MenuItem>({
    name: "",
    imageUrl: "",
    description: "",
  });

  const isEdit = !!menu;

  useEffect(() => {
    if (menu && menu.menuItems && menu.menuItems.length > 0) {
      setMenuItem(menu.menuItems[0]);
    } else {
      setMenuItem({
        name: "",
        imageUrl: "",
        description: "",
      });
    }
    setError(null);
  }, [menu, open]);

  const handleSubmit = async () => {
    if (!currentUser) return;

    setError(null);

    // Validation
    if (!menuItem.name || !menuItem.imageUrl) {
      setError("Menu name and image are required");
      return;
    }

    setLoading(true);

    try {
      if (isEdit && menu) {
        const updateData: UpdateMenuDto = {
          menuItems: [menuItem],
        };
        await updateMenu(menu.id, updateData, currentUser);
      } else {
        const createData: CreateMenuDto = {
          dayOfWeek: dayOfWeek as any,
          weekType: weekType,
          menuItems: [menuItem],
        };
        await createMenu(createData, currentUser);
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to save menu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Menu" : "Create Menu"} - {dayOfWeek} ({weekType} Week)
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="pl-4 block">Menu Name</Label>
            <Input
              placeholder="e.g., BIRYANI, DAAL CHANNA"
              value={menuItem.name}
              onChange={(e) =>
                setMenuItem({ ...menuItem, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="pl-4 block">Image</Label>
            <Select
              value={menuItem.imageUrl}
              onValueChange={(value) =>
                setMenuItem({ ...menuItem, imageUrl: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an image" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_IMAGES.map((img) => (
                  <SelectItem key={img.url} value={img.url}>
                    {img.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {menuItem.imageUrl && (
              <div className="mt-2">
                <img
                  src={menuItem.imageUrl}
                  alt={menuItem.name || "Menu"}
                  className="h-20 w-20 rounded-full border border-border object-cover"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="pl-4 block">Description (Optional)</Label>
            <Input
              placeholder="Menu description"
              value={menuItem.description || ""}
              onChange={(e) =>
                setMenuItem({ ...menuItem, description: e.target.value })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-full"
          >
            {loading ? "Saving..." : isEdit ? "Update Menu" : "Create Menu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
