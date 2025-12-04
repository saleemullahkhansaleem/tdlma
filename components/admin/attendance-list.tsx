"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export type AttendanceRow = {
  name: string;
  status: "open" | "close";
  attendance: "present" | "absent";
  remark: "all-clear" | "unclosed" | "unopened";
};

const ROW_BORDER_CLASSES = {
  "all-clear": "border-primary",
  unclosed: "border-destructive",
  unopened: "border-secondary",
} as const;

export function AttendanceList({ rows }: { rows: AttendanceRow[] }) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <Card
          key={row.name}
          className={`rounded-md ${ROW_BORDER_CLASSES[row.remark]}`}
        >
          <CardContent className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
            <div className="font-medium uppercase tracking-tight">
              {row.name}
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant={row.status === "open" ? "success" : "destructive"}
                className="min-w-[72px] justify-center bg-opacity-20"
              >
                {row.status === "open" ? "Open" : "Close"}
              </Badge>
              <Badge
                variant={row.attendance === "present" ? "success" : "soft"}
                className="min-w-[84px] justify-center"
              >
                {row.attendance === "present" ? "Present" : "Absent"}
              </Badge>
              <Badge
                variant={
                  row.remark === "all-clear" ? "success" : "outline"
                }
                className="min-w-[90px] justify-center"
              >
                {row.remark === "all-clear"
                  ? "All Clear"
                  : row.remark === "unclosed"
                    ? "Unclosed"
                    : "Unopened"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
