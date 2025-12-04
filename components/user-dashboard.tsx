"use client";

import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { useState } from "react";

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [fineAmount, setFineAmount] = useState({ unclosed: 100, unopened: 50 });

  return (
    <div className="min-h-screen bg-muted px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Wed, 10-Oct-2025:
            </p>
            <div className="flex items-center gap-2 text-2xl font-semibold">
              <span>Biryani</span>
              <Image
                src="/biryani.webp"
                alt="Meal"
                width={40}
                height={40}
                className="rounded-full border border-border object-cover"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">

            <ThemeToggle size="icon" variant="ghost" />
            <div className="text-right text-sm leading-tight">
              <p className="font-medium">{user?.name ?? "User"}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                >
                  <Avatar
                    src="/logo.png"
                    alt={user?.name}
                    fallback={user?.name?.[0] ?? "U"}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem className="cursor-pointer">
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={logout}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Alerts */}
        <section className="space-y-3 text-sm">
          <div className="flex max-w-max items-center gap-2 rounded-md bg-yellow-500/10 px-3 py-1 text-sm">
            <span className="mt-0.5 text-lg">⚠️</span>
            <p>
              Reminder: Open time is 10:00 AM. Please book or cancel your lunch
              before the deadline!
            </p>
          </div>

          <div className="max-w-2xl rounded-md bg-sky-500/10 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            <p className="font-semibold text-foreground">What do “Unclosed” and “Unopened” mean?</p>

            <div className="mt-2 space-y-1.5">
              <p>
                <span className="font-medium text-foreground">Unclosed</span> &mdash; you opened the
                food but did not close it again and did not eat it, so the food was wasted.
              </p>
              <p>
                <span className="font-medium text-foreground">Unopened</span> &mdash; you properly
                closed the food box and ate it later (food was not wasted).
              </p>
            </div>

            <div className="mt-3 space-y-1.5">
              <p className="font-semibold text-foreground">Fine policy</p>
              <p>
                For <span className="font-medium text-foreground">Unclosed</span> meals, a fine of{" "}
                <span className="font-mono">Rs {fineAmount.unclosed}/-</span> will be applied.
              </p>
              <p>
                For <span className="font-medium text-foreground">Unopened</span> meals, a fine of{" "}
                <span className="font-mono">Rs {fineAmount.unopened}/-</span> will be applied.
              </p>
            </div>
          </div>
        </section>

        {/* Filters & stats */}
        <section className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-medium">Filters:</p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground"
              >
                This Week
              </Button>
              {["10 Days", "15 Days", "20 Days", "30 Days", "This Month"].map(
                (label) => (
                  <Button
                    key={label}
                    variant="outline"
                    size="sm"
                    className="py-1 text-xs"
                  >
                    {label}
                  </Button>
                ),
              )}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-7">
            {["7", "1", "6", "2", "4", "3", "1700"].map((value, idx) => {
              const labels = [
                "Total Days",
                "Sundays",
                "Work Days",
                "Close",
                "Open",
                "Unclosed",
                "Total fine",
              ];
              return (
                <Card key={labels[idx]} className="rounded-md border border-border">
                  <CardContent className="p-3 flex flex-col items-center gap-2">
                    <div className="flex h-10 w-full items-center justify-center rounded-md bg-secondary text-lg font-semibold text-secondary-foreground">
                      {value}
                    </div>
                    <p className="text-[11px] text-muted-foreground text-center">
                      {labels[idx]}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Timetable */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Timetable</h2>
          <Card className="rounded-md">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60 text-xs font-semibold text-muted-foreground">
                    <TableHead className="px-4 py-3 text-left">Day and Date</TableHead>
                    <TableHead className="px-4 py-3 text-left">Menu</TableHead>
                    <TableHead className="px-4 py-3 text-left">Status</TableHead>
                    <TableHead className="px-4 py-3 text-left">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { day: "MON, 10-Oct-2025", sub: "Yesterday", status: "Open", action: "" },
                    { day: "TUE, 11-Oct-2025", sub: "Today", status: "Close", action: "Open" },
                    { day: "WED, 12-Oct-2025", sub: "Tomorrow", status: "Open", action: "Close" },
                    { day: "THU, 13-Oct-2025", sub: "", status: "Close", action: "Open" },
                    { day: "FRI, 14-Oct-2025", sub: "", status: "Open", action: "Close" },
                    { day: "SAT, 15-Oct-2025", sub: "", status: "Open", action: "Close" },
                    { day: "SUN, 16-Oct-2025", sub: "", status: "-", action: "" },
                  ].map((row) => (
                    <TableRow key={row.day}>
                      <TableCell className="px-4 py-3 align-top">
                        <div className="flex flex-col">
                          <span className="font-medium">{row.day}</span>
                          {row.sub && (
                            <span className="text-xs text-muted-foreground">
                              {row.sub}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 align-top text-muted-foreground">
                        {row.status === "-" ? "-" : "Biryani"}
                      </TableCell>
                      <TableCell className="px-4 py-3 align-top">
                        {row.status === "Open" && (
                          <span className="inline-flex rounded-full bg-emerald-50 px-4 py-1 text-xs font-medium text-emerald-700">
                            Open
                          </span>
                        )}
                        {row.status === "Close" && (
                          <span className="inline-flex rounded-full bg-red-50 px-4 py-1 text-xs font-medium text-red-700">
                            Close
                          </span>
                        )}
                        {row.status === "-" && "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 align-top">
                        {row.action && (
                          <Button
                            size="sm"
                            variant={row.action === "Open" ? "outline" : "default"}
                          >
                            {row.action}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
