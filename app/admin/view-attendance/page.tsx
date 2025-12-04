"use client";

import { Card, CardContent } from "@/components/ui/card";

const allClear = [
  "ALI KHAN SWATI",
  "HASSAN KHAN SWATI",
  "MUHIB KHAN SWATI",
  "IRTAZA KHAN SWATI",
  "DANISH KHAN SWATI",
];

const unclosed = ["ZAYAN KHAN SWATI", "SHAQEEB KHAN SWATI", "AHMMED KHAN SWATI"];

const unopened = [
  "ESSA KHAN SWATI",
  "MUSA KHAN SWATI",
  "FAIZAN KHAN SWATI",
  "AHAD KHAN SWATI",
];

function StatusColumn({
  title,
  color,
  items,
}: {
  title: string;
  color: "green" | "red" | "orange";
  items: string[];
}) {
  const border =
    color === "green"
      ? "border-primary"
      : color === "red"
        ? "border-destructive"
        : "border-secondary";

  const headerBg =
    color === "green"
      ? "bg-primary/10 text-primary"
      : color === "red"
        ? "bg-destructive/10 text-destructive"
        : "bg-secondary/10 text-secondary";

  return (
    <Card className={`rounded-md ${border}`}>
      <CardContent className="p-4">
        <div
          className={`inline-flex rounded-full px-4 py-1 text-xs font-semibold ${headerBg}`}
        >
          {title}
        </div>
        <div className="mt-4 space-y-1.5 text-sm">
          {items.map((name) => (
            <div key={name} className="uppercase tracking-tight">
              {name}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ViewAttendancePage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl font-semibold">View Attendance</h1>
        <button className="self-start rounded-full border border-input bg-background px-4 py-1 text-xs font-medium text-muted-foreground">
          Today
        </button>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        <StatusColumn title="All Clear" color="green" items={allClear} />
        <StatusColumn title="Unclosed" color="red" items={unclosed} />
        <StatusColumn title="Unopened" color="orange" items={unopened} />
      </section>
    </div>
  );
}
