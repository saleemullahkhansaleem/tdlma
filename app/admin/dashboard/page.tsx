"use client";

import { StatsCard } from "@/components/admin/stats-card";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Expectations:</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard label="Total Consumers" value="50" />
          <StatsCard label="Meals Booked Today" value="35" />
          <StatsCard label="Meals Cancelled" value="15" />
          <StatsCard label="Total Loss" value="0" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Reality:</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard label="Total Open" value="35" />
          <StatsCard label="Total Close" value="5" />
          <StatsCard label="Total Unopen" value="2" />
          <StatsCard label="Total Unclose" value="16" />
        </div>
      </section>
    </div>
  );
}
