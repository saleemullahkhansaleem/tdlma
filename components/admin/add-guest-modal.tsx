"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { getAllUsers } from "@/lib/api/client";
import { createGuest } from "@/lib/api/client";
import { User } from "@/lib/types/user";
import { MealType } from "@/lib/types/attendance";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AddGuestModal({
  open,
  onOpenChange,
  date,
  mealType,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  mealType: MealType;
  onSuccess?: () => void;
}) {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [inviterId, setInviterId] = useState<string>("");
  const [count, setCount] = useState(1);
  const [guestNames, setGuestNames] = useState<string[]>([""]);

  // Load users when modal opens
  useEffect(() => {
    if (open && currentUser) {
      loadUsers();
    }
  }, [open, currentUser]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setInviterId("");
      setCount(1);
      setGuestNames([""]);
      setError(null);
    }
  }, [open]);

  const loadUsers = async () => {
    if (!currentUser) return;

    try {
      const allUsers = await getAllUsers(currentUser);
      const regularUsers = allUsers.filter((u) => u.role === "user");
      setUsers(regularUsers);
      if (regularUsers.length > 0 && !inviterId) {
        setInviterId(regularUsers[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    }
  };

  function handleCountChange(value: string) {
    const numeric = Math.max(1, Number(value) || 1);
    setCount(numeric);
    setGuestNames((prev) => {
      const next = [...prev];
      if (numeric > next.length) {
        while (next.length < numeric) next.push("");
      } else {
        next.length = numeric;
      }
      return next;
    });
  }

  function handleGuestNameChange(index: number, value: string) {
    setGuestNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  async function handleAdd() {
    if (!currentUser) return;

    setError(null);

    // Validation
    if (!inviterId) {
      setError("Please select an inviter");
      return;
    }

    if (guestNames.length === 0 || guestNames.every((name) => !name.trim())) {
      setError("Please enter at least one guest name");
      return;
    }

    // Filter out empty names
    const validGuestNames = guestNames.filter((name) => name.trim());

    if (validGuestNames.length === 0) {
      setError("Please enter at least one guest name");
      return;
    }

    setLoading(true);

    try {
      // Create guests array
      const guestsToCreate = validGuestNames.map((name) => ({
        inviterId,
        name: name.trim(),
        date,
        mealType,
      }));

      await createGuest(guestsToCreate, currentUser);

      // Reset form
      setInviterId(users.length > 0 ? users[0].id : "");
      setCount(1);
      setGuestNames([""]);
      setError(null);

      // Close modal and refresh attendance
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Failed to add guests");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Guest</DialogTitle>
          <DialogDescription>
            Add guests for {date} - {mealType}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-4 text-sm">
          <div className="space-y-2">
            <label className="font-medium">Inviter</label>
            <Select value={inviterId} onValueChange={setInviterId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an inviter" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="font-medium">Number of Guests</label>
            <Input
              type="number"
              min={1}
              value={count}
              onChange={(e) => handleCountChange(e.target.value)}
            />
          </div>

          {guestNames.map((name, index) => (
            <div key={index} className="space-y-2">
              <label className="font-medium">Guest {index + 1} Name</label>
              <Input
                type="text"
                placeholder={`Enter guest ${index + 1} name`}
                value={name}
                onChange={(e) => handleGuestNameChange(index, e.target.value)}
                required
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-full px-6"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-full px-6"
            onClick={handleAdd}
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Guests"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
