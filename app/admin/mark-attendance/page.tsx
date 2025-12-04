"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddGuestModal } from "@/components/admin/add-guest-modal";
import { AttendanceList, AttendanceRow } from "@/components/admin/attendance-list";

const rows: AttendanceRow[] = [
  { name: "ALI KHAN SWATI", status: "open", attendance: "present", remark: "all-clear" },
  { name: "Hassan KHAN SWATI", status: "close", attendance: "absent", remark: "all-clear" },
  { name: "MUHIB KHAN SWATI", status: "open", attendance: "present", remark: "all-clear" },
  { name: "IRTAZA KHAN SWATI", status: "open", attendance: "absent", remark: "unclosed" },
];

export default function MarkAttendancePage() {
  const [openGuest, setOpenGuest] = useState(false);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Mark Attendance</h1>
          <p className="text-sm text-muted-foreground">
            Update today&apos;s attendance and add guests.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="soft" className="rounded-full px-4 py-1">
            Today
          </Badge>
          <Button
            className="rounded-full px-5"
            onClick={() => setOpenGuest(true)}
          >
            Add Guest
          </Button>
        </div>
      </header>

      <section>
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] text-[13px] font-semibold text-muted-foreground mb-3 px-1">
          <span>Name</span>
          <span>Status</span>
          <span>Attendance</span>
          <span>Remarks</span>
        </div>
        <AttendanceList rows={rows} />
      </section>

      <AddGuestModal open={openGuest} onOpenChange={setOpenGuest} />
    </div>
  );
}
