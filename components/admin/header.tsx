"use client";

import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "../theme-toggle";

export function AdminHeader() {
  const { user } = useAuth();

  return (
    <div className="flex w-full items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Wed, 10-Oct-2025</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">Biryani</span>
            <Image
              src="/biryani.webp"
              alt="Meal"
              width={32}
              height={32}
              className="rounded-full border border-border object-cover"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle size="icon" variant="ghost" />
        <div className="text-right text-sm leading-tight">
          <p className="font-medium">{user?.name ?? "Admin"}</p>
        </div>
        <Avatar
          src={"/logo.png"}
          alt={user?.name}
          fallback={user?.name?.[0] ?? "A"}
        />
      </div>
    </div>
  );
}
