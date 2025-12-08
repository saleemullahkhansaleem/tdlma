"use client";

import { useState, useEffect } from "react";
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
import { createAttendance, updateAttendance, deleteAttendance, getSettings } from "@/lib/api/client";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export interface AttendanceListProps {
  attendance: AttendanceWithUser[];
  onUpdate: () => void;
  onItemUpdate?: (updatedItem: AttendanceWithUser) => void;
  selectedDate: string;
}

const REMARK_COLORS = {
  "All Clear": "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
  Unclosed: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
  Unopened: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800",
} as const;

const STATUS_COLORS = {
  open: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
  close: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
} as const;

export function AttendanceList({ attendance, onUpdate, onItemUpdate, selectedDate }: AttendanceListProps) {
  const { user: currentUser } = useAuth();
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [closeTime, setCloseTime] = useState<string>("18:00");
  const [isBeforeCloseTime, setIsBeforeCloseTime] = useState<boolean>(false);

  // Get today's date in local timezone
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Check if selected date is today and if current time is before closeTime
  useEffect(() => {
    const loadSettings = async () => {
      if (!currentUser) return;

      try {
        const settings = await getSettings(currentUser);
        setCloseTime(settings.closeTime);

        const todayString = getLocalDateString(new Date());
        const isToday = selectedDate === todayString;

        if (isToday) {
          const now = new Date();
          const [closeHour, closeMinute] = settings.closeTime.split(":").map(Number);
          const closeTimeDate = new Date();
          closeTimeDate.setHours(closeHour, closeMinute, 0, 0);

          setIsBeforeCloseTime(now < closeTimeDate);
        } else {
          setIsBeforeCloseTime(false);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };

    loadSettings();
  }, [currentUser, selectedDate]);
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
          // Find the current item
          const currentItem = attendance.find((a) => a.id === attendanceId);

          // Optimistically update local state immediately
          if (currentItem && onItemUpdate) {
            onItemUpdate({
              ...currentItem,
              status: null,
              remark: null,
              updatedAt: new Date(),
            });
          }

          // Then update in the background
          updateAttendance(
            attendanceId,
            { status: null },
            currentUser
          ).catch((error) => {
            console.error("Failed to reset attendance:", error);
            // On error, reload all data
            onUpdate();
          });
        } else {
          onUpdate();
        }

        // Expand buttons (remove from collapsed set) to show both buttons
        setCollapsedButtons((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      } catch (error) {
        console.error("Failed to reset attendance:", error);
        // On error, reload all data
        onUpdate();
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
      // Helper to calculate remark based on status and isOpen
      const calculateRemark = (
        status: "Present" | "Absent" | null,
        isOpen: boolean
      ): "All Clear" | "Unclosed" | "Unopened" | null => {
        if (status === null) return null;
        if (status === "Present" && isOpen) return "All Clear";
        if (status === "Absent" && !isOpen) return "All Clear";
        if (status === "Absent" && isOpen) return "Unclosed";
        if (status === "Present" && !isOpen) return "Unopened";
        return null;
      };

      if (attendanceId) {
        // Find the current item
        const currentItem = attendance.find((a) => a.id === attendanceId);
        const isOpen = currentItem?.isOpen ?? true;

        // Optimistically update local state immediately
        if (currentItem && onItemUpdate) {
          const calculatedRemark = calculateRemark(newStatus, isOpen);
          onItemUpdate({
            ...currentItem,
            status: newStatus,
            remark: calculatedRemark,
            updatedAt: new Date(),
          });
        }

        // Then update in the background
        updateAttendance(
          attendanceId,
          { status: newStatus },
          currentUser
        ).catch((error) => {
          console.error("Failed to update attendance:", error);
          // On error, reload all data
          onUpdate();
        });
      } else {
        // Find the user info from current attendance list
        const currentItem = attendance.find((a) => a.userId === userId);
        const isOpen = true; // New records default to open
        const calculatedRemark = calculateRemark(newStatus, isOpen);

        // Optimistically add the new item if we have user info
        if (currentItem && onItemUpdate) {
          const newItem: AttendanceWithUser = {
            id: `temp-${Date.now()}`, // Temporary ID
            userId,
            date,
            mealType: mealType as any,
            status: newStatus,
            isOpen: true,
            remark: calculatedRemark,
            fineAmount: "0",
            user: currentItem.user,
            guestCount: currentItem.guestCount || 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          onItemUpdate(newItem);

          // Then create in the background (non-blocking)
          createAttendance(
            {
              userId,
              date,
              mealType: mealType as any,
              status: newStatus,
            },
            currentUser
          )
            .then((response) => {
              // Update with real ID and data from server
              onItemUpdate({
                ...newItem,
                id: response.id,
                status: newStatus,
                remark: response.remark || calculatedRemark,
                isOpen: response.isOpen ?? true,
                fineAmount: response.fineAmount || "0",
                createdAt: response.createdAt,
                updatedAt: response.updatedAt,
              });
            })
            .catch((error) => {
              console.error("Failed to create attendance:", error);
              // On error, reload all data
              onUpdate();
            });
        } else {
          // If we don't have the item, create and reload
          createAttendance(
            {
              userId,
              date,
              mealType: mealType as any,
              status: newStatus,
            },
            currentUser
          )
            .then(() => {
              onUpdate();
            })
            .catch((error) => {
              console.error("Failed to create attendance:", error);
              onUpdate();
            });
        }
      }

      // Collapse buttons after update (add to collapsed set)
      setCollapsedButtons((prev) => new Set(prev).add(key));
    } catch (error) {
      console.error("Failed to update attendance:", error);
      // On error, reload all data
      onUpdate();
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

    // Disable buttons if date is today and current time is before closeTime
    const todayString = getLocalDateString(new Date());
    const isToday = date === todayString;
    const buttonsDisabled = isToday && isBeforeCloseTime;

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
            disabled={isUpdating || buttonsDisabled}
            title={buttonsDisabled ? `Attendance can only be marked after ${closeTime}` : ""}
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
            disabled={isUpdating || buttonsDisabled}
            title={buttonsDisabled ? `Attendance can only be marked after ${closeTime}` : ""}
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
          variant={currentStatus === "Present" ? "default" : "destructive"}
          className={cn(
            " text-xs min-w-[84px]",
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
          disabled={isUpdating || buttonsDisabled}
          title={buttonsDisabled ? `Attendance can only be marked after ${closeTime}` : ""}
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

            // Determine status badge (open/close) based on isOpen field
            const isOpen = item.isOpen ?? true;
            const statusBadge: "open" | "close" = isOpen ? "open" : "close";

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
