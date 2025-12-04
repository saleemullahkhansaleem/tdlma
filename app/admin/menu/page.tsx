"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

const evenWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const oddWeek = ["Tuesday", "Monday", "Wednesday", "Thursday", "Friday", "Saturday"];

function MenuCard({ day }: { day: string }) {
  return (
    <Card className="rounded-2xl border-2 border-orange-300 bg-card">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1 text-sm">
            <p className="font-medium">Day: {day.toUpperCase()}</p>
            <p className="text-muted-foreground">Menu: BIRYANI</p>
          </div>
          <Image
            src="/logo.png"
            alt="Meal"
            width={64}
            height={64}
            className="rounded-full border border-border object-cover"
          />
        </div>
        <button className="self-start mt-1 rounded-full bg-primary px-5 py-1.5 text-xs font-medium text-primary-foreground shadow-sm">
          Edit
        </button>
      </CardContent>
    </Card>
  );
}

export default function AdminMenuPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Menu</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Week Even:</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {evenWeek.map((day) => (
            <MenuCard key={day} day={day} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Week Odd:</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {oddWeek.map((day) => (
            <MenuCard key={day} day={day} />
          ))}
        </div>
      </section>
    </div>
  );
}
