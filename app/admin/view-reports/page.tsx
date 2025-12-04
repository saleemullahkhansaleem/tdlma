"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const metrics = [
  { label: "Total Days", value: "06" },
  { label: "Work Days", value: "05" },
  { label: "Sunday", value: "01" },
];

const consumers = Array.from({ length: 4 }, (_, i) => ({
  id: i,
  name: "Ali Khan Swati",
  designation: "Student",
  totalOpened: 3,
  totalClosed: 2,
  totalUnopened: 1,
  totalUnclosed: 1,
  fine: 1000,
}));

function ConsumerCard() {
  return (
    <Card className="border-primary">
      <CardContent className="p-4 text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Name</span>
          <span className="font-semibold">Ali Khan Swati</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Designation</span>
          <span className="font-semibold">Student</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Opened</span>
          <span className="font-semibold">3</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Closed</span>
          <span className="font-semibold">2</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Unopened</span>
          <span className="font-semibold">1</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Unclosed</span>
          <span className="font-semibold">1</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Fine</span>
          <span className="font-semibold">1000</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ViewReportsPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl font-semibold">View Reports</h1>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Input
              placeholder="Search"
              className="pl-4 pr-4 h-9 rounded-full bg-background"
            />
          </div>
          <button className="self-start rounded-full border border-input bg-background px-4 py-1 text-xs font-medium text-muted-foreground">
            10-Oct to 15-Oct
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {metrics.map((m) => (
          <Card
            key={m.label}
          >
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <div className="flex h-12 w-full items-center justify-center rounded-lg bg-secondary text-2xl font-semibold text-secondary-foreground">
                {m.value}
              </div>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Consumers Details:</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {consumers.map((c, idx) => (
            <ConsumerCard key={c.id} />
          ))}
        </div>
      </section>
    </div>
  );
}
