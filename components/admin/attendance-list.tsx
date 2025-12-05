"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AttendanceWithUser } from "@/lib/types/attendance";
import { createAttendance, updateAttendance, deleteAttendance } from "@/lib/api/client";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export interface AttendanceListProps {
  attendance: AttendanceWithUser[];
  onUpdate: () => void;
}

const REMARK_COLORS = {
  "All Clear": "bg-green-100 text-green-700 border-green-200",
  Unclosed: "bg-red-100 text-red-700 border-red-200",
  Unopened: "bg-orange-100 text-orange-700 border-orange-200",
} as const;

const STATUS_COLORS = {
  open: "bg-green-100 text-green-700 border-green-200",
  close: "bg-red-100 text-red-700 border-red-200",
} as const;

export function AttendanceList({ attendance, onUpdate }: AttendanceListProps) {
  const { user: currentUser } = useAuth();
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  // Track which buttons are collapsed (showing single button)
  // By default, buttons are expanded (show two buttons) when status is null
  // When status is set, buttons are collapsed (show single button)
  const [collapsedButtons, setCollapsedButtons] = useState<Set<string>>(() => {
    // Initialize: collapse buttons that have a non-null status
    const initial = new Set<string>();
    attendance.forEach((item) => {
      if (item.status !== null && item.status !== undefined) {
        const key = `${item.userId}-${item.date}-${item.mealType}`;
        initial.add(key);
      }
    });
    return initial;
  });

  const handleAttendanceClick = async (
    userId: string,
    attendanceId: string | null,
    currentStatus: "Present" | "Absent" | null,
    newStatus: "Present" | "Absent" | null,
    date: string,
    mealType: string
  ) => {
    if (!currentUser) return;

    const key = `${userId}-${date}-${mealType}`;
    const isCollapsed = collapsedButtons.has(key);

    // If buttons are collapsed (single button showing a status), clicking it should reset to null
    if (isCollapsed && currentStatus !== null) {
      setUpdatingIds((prev) => new Set(prev).add(key));
      try {
        if (attendanceId) {
          // Update existing attendance to null status
          await updateAttendance(
            attendanceId,
            { status: null },
            currentUser
          );
        }
        onUpdate();
        // Expand buttons (remove from collapsed set) to show both buttons
        setCollapsedButtons((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      } catch (error) {
        console.error("Failed to reset attendance:", error);
      } finally {
        setUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
      return;
    }

    // If buttons are expanded (two buttons) or status is null, save the selected status and collapse
    if (newStatus === null) return; // Should not happen, but safety check

    setUpdatingIds((prev) => new Set(prev).add(key));
    try {
      if (attendanceId) {
        // Update existing attendance
        await updateAttendance(
          attendanceId,
          { status: newStatus },
          currentUser
        );
      } else {
        // Create new attendance
        await createAttendance(
          {
            userId,
            date,
            mealType: mealType as any,
            status: newStatus,
          },
          currentUser
        );
      }
      onUpdate();
      // Collapse buttons after update (add to collapsed set)
      setCollapsedButtons((prev) => new Set(prev).add(key));
    } catch (error) {
      console.error("Failed to update attendance:", error);
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const getStatusBadge = (status: "open" | "close") => {
    return (
      <Badge
        variant="outline"
        className={cn(
          "min-w-[72px] justify-center bg-opacity-20",
          STATUS_COLORS[status]
        )}
      >
        {status === "open" ? "Open" : "Close"}
      </Badge>
    );
  };

  const getRemarkBadge = (remark: string | null) => {
    if (!remark) return null;
    const remarkKey = remark as keyof typeof REMARK_COLORS;
    return (
      <Badge
        variant="outline"
        className={cn("min-w-[90px] justify-center", REMARK_COLORS[remarkKey] || "")}
      >
        {remark}
      </Badge>
    );
  };

  const getAttendanceButtons = (
    userId: string,
    attendanceId: string | null,
    currentStatus: "Present" | "Absent" | null,
    date: string,
    mealType: string
  ) => {
    const key = `${userId}-${date}-${mealType}`;
    const isCollapsed = collapsedButtons.has(key);
    const isUpdating = updatingIds.has(key);

    // If status is null or buttons are expanded, show both buttons
    if (currentStatus === null || !isCollapsed) {
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 rounded-full px-4 text-xs bg-muted text-muted-foreground hover:bg-muted/80"
            onClick={() =>
              handleAttendanceClick(
                userId,
                attendanceId,
                currentStatus,
                "Present",
                date,
                mealType
              )
            }
            disabled={isUpdating}
          >
            Present
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 rounded-full px-4 text-xs bg-muted text-muted-foreground hover:bg-muted/80"
            onClick={() =>
              handleAttendanceClick(
                userId,
                attendanceId,
                currentStatus,
                "Absent",
                date,
                mealType
              )
            }
            disabled={isUpdating}
          >
            Absent
          </Button>
        </div>
      );
    } else {
      // Show single button with current status (collapsed state)
      return (
        <Button
          size="sm"
          variant={currentStatus === "Present" ? "default" : "outline"}
          className={cn(
            "h-7 rounded-full px-4 text-xs min-w-[84px]",
            currentStatus === "Present"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
          onClick={() =>
            handleAttendanceClick(
              userId,
              attendanceId,
              currentStatus,
              currentStatus, // Pass current status, handler will reset to null
              date,
              mealType
            )
          }
          disabled={isUpdating}
        >
          {currentStatus}
        </Button>
      );
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Attendance</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Remarks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attendance.map((item) => {
            const status: "Present" | "Absent" | null =
              item.status === "Present" || item.status === "Absent" ? item.status : null;
            const remark = item.remark || null;
            // Determine status badge (open/close) based on remark
            // "Unclosed" means close, otherwise open
            const statusBadge = remark === "Unclosed" ? "close" : "open";

            return (
              <TableRow key={item.userId}>
                <TableCell>
                  <div className="font-medium uppercase tracking-tight">
                    {item.user.name}
                    {item.guestCount !== undefined && item.guestCount !== null && item.guestCount > 0 && (
                      <Badge
                        variant="outline"
                        className="ml-2 text-xs font-normal normal-case bg-muted"
                      >
                        {item.guestCount} {item.guestCount === 1 ? "Guest" : "Guests"}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {getAttendanceButtons(
                    item.userId,
                    item.id || null,
                    status,
                    item.date,
                    item.mealType
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(statusBadge)}</TableCell>
                <TableCell>{getRemarkBadge(remark)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
