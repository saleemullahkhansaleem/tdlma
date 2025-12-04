"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const INVITERS = ["Ali Khan Swati", "Hassan Khan Swati", "Muhib Khan Swati"];

export function AddGuestModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [inviter, setInviter] = useState(INVITERS[0]);
  const [count, setCount] = useState(2);
  const [guestNames, setGuestNames] = useState<string[]>(["", ""]);

  function handleCountChange(value: string) {
    const numeric = Number(value) || 0;
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

  function handleAdd() {
    // In future, call backend to persist
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Guest</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4 text-sm">
          <div className="space-y-1">
            <label className="font-medium">Inviter</label>
            <select
              className="h-10 w-full rounded-full border border-input bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={inviter}
              onChange={(e) => setInviter(e.target.value)}
            >
              {INVITERS.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-medium">Guests Count</label>
            <Input
              type="number"
              min={0}
              value={count || ""}
              onChange={(e) => handleCountChange(e.target.value)}
            />
          </div>

          {guestNames.map((name, index) => (
            <div key={index} className="space-y-1">
              <label className="font-medium">Guest {index + 1} Name</label>
              <Input
                type="text"
                placeholder={`Guest ${index + 1} Name`}
                value={name}
                onChange={(e) => handleGuestNameChange(index, e.target.value)}
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
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-full px-6"
            onClick={handleAdd}
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
