"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { DateRangeFilter } from "@/components/admin/date-range-filter";
import { Search, BarChart2, AlertCircle } from "lucide-react";
import { getAttendance, updateAttendance, getSettings } from "@/lib/api/client";
import { AttendanceWithUser } from "@/lib/types/attendance";
import { calculateRemark } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserReportData {
  userId: string;
  userName: string;
  userEmail: string;
  avatarUrl: string | null;
  totalOpened: number;
  totalClosed: number;
  totalUnopened: number;
  totalUnclosed: number;
  totalFine: number;
  attendanceRecords: AttendanceWithUser[];
}

interface ReportsStats {
  totalDays: number;
  workDays: number;
  sundays: number;
  totalUsers: number;
  totalFine: number;
  totalOpened: number;
  totalClosed: number;
  totalUnopened: number;
  totalUnclosed: number;
}

export default function ViewReportsPage() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userReports, setUserReports] = useState<UserReportData[]>([]);
  const [stats, setStats] = useState<ReportsStats>({
    totalDays: 0,
    workDays: 0,
    sundays: 0,
    totalUsers: 0,
    totalFine: 0,
    totalOpened: 0,
    totalClosed: 0,
    totalUnopened: 0,
    totalUnclosed: 0,
  });

  // Initialize with current month
  const getCurrentMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start, end };
  };

  const { start: defaultStart, end: defaultEnd } = getCurrentMonthRange();
  const [startDate, setStartDate] = useState<Date | null>(defaultStart);
  const [endDate, setEndDate] = useState<Date | null>(defaultEnd);
  const [settings, setSettings] = useState({
    fineAmountUnclosed: 0,
    fineAmountUnopened: 0,
  });

  // Fine action dialog state
  const [fineDialogOpen, setFineDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserReportData | null>(null);
  const [fineAction, setFineAction] = useState<"pay" | "reduce" | "waive" | null>(null);
  const [fineAmount, setFineAmount] = useState("");
  const [processingFine, setProcessingFine] = useState(false);

  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getDayOfWeek = (date: Date): number => {
    return date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  };

  const loadReports = async () => {
    if (!user || !startDate || !endDate) return;

    setLoading(true);
    try {
      // Load settings first
      const settingsData = await getSettings(user);
      setSettings({
        fineAmountUnclosed: settingsData.fineAmountUnclosed,
        fineAmountUnopened: settingsData.fineAmountUnopened,
      });

      // Generate all dates in range
      const dates: string[] = [];
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        dates.push(getLocalDateString(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Fetch attendance for all dates in parallel
      const attendancePromises = dates.map((date) =>
        getAttendance(user, { date, mealType: "Lunch" }).catch(() => [])
      );
      const attendanceResults = await Promise.all(attendancePromises);
      const allAttendance = attendanceResults.flat();

      // Group by user and calculate stats
      const userMap = new Map<string, UserReportData>();

      allAttendance.forEach((att) => {
        if (!userMap.has(att.userId)) {
          userMap.set(att.userId, {
            userId: att.userId,
            userName: att.user.name,
            userEmail: att.user.email,
            avatarUrl: att.user.avatarUrl,
            totalOpened: 0,
            totalClosed: 0,
            totalUnopened: 0,
            totalUnclosed: 0,
            totalFine: 0,
            attendanceRecords: [],
          });
        }

        const userData = userMap.get(att.userId)!;
        userData.attendanceRecords.push(att);

        const isOpen = att.isOpen ?? true;
        if (isOpen) {
          userData.totalOpened++;
        } else {
          userData.totalClosed++;
        }

        // Calculate remark from status and isOpen (computed, not stored)
        const attendanceStatus = att.status === "Present" || att.status === "Absent"
          ? att.status
          : null;
        const remark = calculateRemark(attendanceStatus, isOpen);

        if (remark === "Unclosed") {
          userData.totalUnclosed++;
          userData.totalFine += settingsData.fineAmountUnclosed;
        } else if (remark === "Unopened") {
          userData.totalUnopened++;
          userData.totalFine += settingsData.fineAmountUnopened;
        }

        // Add existing fine amount from attendance record
        const existingFine = parseFloat(att.fineAmount || "0");
        userData.totalFine += existingFine;
      });

      const reports = Array.from(userMap.values());

      // Calculate overall stats
      let totalDays = dates.length;
      let workDays = 0;
      let sundays = 0;
      let totalFine = 0;
      let totalOpened = 0;
      let totalClosed = 0;
      let totalUnopened = 0;
      let totalUnclosed = 0;

      dates.forEach((dateStr) => {
        const date = new Date(dateStr);
        const dayOfWeek = getDayOfWeek(date);
        if (dayOfWeek === 0) {
          sundays++;
        } else {
          workDays++;
        }
      });

      reports.forEach((userData) => {
        totalFine += userData.totalFine;
        totalOpened += userData.totalOpened;
        totalClosed += userData.totalClosed;
        totalUnopened += userData.totalUnopened;
        totalUnclosed += userData.totalUnclosed;
      });

      setStats({
        totalDays,
        workDays,
        sundays,
        totalUsers: reports.length,
        totalFine,
        totalOpened,
        totalClosed,
        totalUnopened,
        totalUnclosed,
      });

      setUserReports(reports);
    } catch (error) {
      console.error("Failed to load reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [user, startDate, endDate]);

  const handleFineAction = (userData: UserReportData, action: "pay" | "reduce" | "waive") => {
    setSelectedUser(userData);
    setFineAction(action);
    setFineAmount("");
    setFineDialogOpen(true);
  };

  const processFineAction = async () => {
    if (!selectedUser || !fineAction || !user) return;

    setProcessingFine(true);
    try {
      // For now, we'll update the fine amount in the attendance records
      // In a real implementation, you might want to create a separate fine transactions table
      const amount = parseFloat(fineAmount) || 0;

      // Update all attendance records for this user in the date range
      const recordsToUpdate = selectedUser.attendanceRecords.filter((att) => {
        const recordFine = parseFloat(att.fineAmount || "0");
        return recordFine > 0; // Only update records with existing fines
      });

      if (fineAction === "pay") {
        // Mark as paid (reduce fine to 0)
        for (const record of recordsToUpdate) {
          await updateAttendance(record.id, { fineAmount: 0 }, user);
        }
      } else if (fineAction === "reduce") {
        // Reduce fine by amount
        for (const record of recordsToUpdate) {
          const currentFine = parseFloat(record.fineAmount || "0");
          const newFine = Math.max(0, currentFine - amount);
          await updateAttendance(record.id, { fineAmount: newFine }, user);
        }
      } else if (fineAction === "waive") {
        // Waive all fines (set to 0)
        for (const record of recordsToUpdate) {
          await updateAttendance(record.id, { fineAmount: 0 }, user);
        }
      }

      // Reload reports
      await loadReports();
      setFineDialogOpen(false);
      setSelectedUser(null);
      setFineAction(null);
      setFineAmount("");
    } catch (error) {
      console.error("Failed to process fine action:", error);
      alert("Failed to process fine action. Please try again.");
    } finally {
      setProcessingFine(false);
    }
  };

  const filteredReports = userReports.filter((report) =>
    report.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-primary" />
            View Reports
          </h2>
          <p className="text-sm text-muted-foreground">
            View attendance reports and manage fines for users
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-md border bg-card p-4">
        <div className="flex-1 min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
        </div>
        <div className="w-full sm:w-auto">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />
        </div>
      </div>

      {/* Stats Info */}
      {!loading && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredReports.length} of {userReports.length} users
          {startDate && endDate && (
            <span className="ml-2">
              • {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9">
        <Card className="rounded-md border border-border">
          <CardContent className="p-3 flex flex-col items-center gap-2">
            {loading ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-16" />
              </>
            ) : (
              <>
                <div className="flex h-10 w-full items-center justify-center rounded-md bg-secondary text-lg font-semibold text-secondary-foreground">
                  {stats.totalDays}
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  Total Days
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-md border border-border">
          <CardContent className="p-3 flex flex-col items-center gap-2">
            {loading ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-16" />
              </>
            ) : (
              <>
                <div className="flex h-10 w-full items-center justify-center rounded-md bg-secondary text-lg font-semibold text-secondary-foreground">
                  {stats.workDays}
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  Work Days
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-md border border-border">
          <CardContent className="p-3 flex flex-col items-center gap-2">
            {loading ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-16" />
              </>
            ) : (
              <>
                <div className="flex h-10 w-full items-center justify-center rounded-md bg-secondary text-lg font-semibold text-secondary-foreground">
                  {stats.totalUsers}
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  Total Users
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-md border border-border">
          <CardContent className="p-3 flex flex-col items-center gap-2">
            {loading ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-16" />
              </>
            ) : (
              <>
                <div className="flex h-10 w-full items-center justify-center rounded-md bg-secondary text-lg font-semibold text-secondary-foreground">
                  {stats.totalFine.toFixed(0)}
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  Total Fine (Rs)
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-md border border-border">
          <CardContent className="p-3 flex flex-col items-center gap-2">
            {loading ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-16" />
              </>
            ) : (
              <>
                <div className="flex h-10 w-full items-center justify-center rounded-md bg-secondary text-lg font-semibold text-secondary-foreground">
                  {stats.totalOpened}
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  Opened
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-md border border-border">
          <CardContent className="p-3 flex flex-col items-center gap-2">
            {loading ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-16" />
              </>
            ) : (
              <>
                <div className="flex h-10 w-full items-center justify-center rounded-md bg-secondary text-lg font-semibold text-secondary-foreground">
                  {stats.totalClosed}
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  Closed
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-md border border-border">
          <CardContent className="p-3 flex flex-col items-center gap-2">
            {loading ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-16" />
              </>
            ) : (
              <>
                <div className="flex h-10 w-full items-center justify-center rounded-md bg-secondary text-lg font-semibold text-secondary-foreground">
                  {stats.totalUnclosed}
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  Unclosed
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-md border border-border">
          <CardContent className="p-3 flex flex-col items-center gap-2">
            {loading ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-16" />
              </>
            ) : (
              <>
                <div className="flex h-10 w-full items-center justify-center rounded-md bg-secondary text-lg font-semibold text-secondary-foreground">
                  {stats.totalUnopened}
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  Unopened
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-md border border-border">
          <CardContent className="p-3 flex flex-col items-center gap-2">
            {loading ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-16" />
              </>
            ) : (
              <>
                <div className="flex h-10 w-full items-center justify-center rounded-md bg-secondary text-lg font-semibold text-secondary-foreground">
                  {stats.sundays}
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  Sundays
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      {filteredReports.length === 0 && !loading ? (
        <div className="rounded-md border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            {searchQuery
              ? "No users match your search"
              : "No users found for the selected date range"}
          </p>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px] sm:min-w-[250px]">Name</TableHead>
                  <TableHead className="min-w-[80px]">Opened</TableHead>
                  <TableHead className="min-w-[80px]">Closed</TableHead>
                  <TableHead className="min-w-[90px]">Unclosed</TableHead>
                  <TableHead className="min-w-[90px]">Unopened</TableHead>
                  <TableHead className="min-w-[100px]">Total Fine</TableHead>
                  <TableHead className="text-right min-w-[280px] sm:min-w-[320px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Skeleton rows
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="min-w-[200px] sm:min-w-[250px]">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[80px]">
                        <Skeleton className="h-4 w-8" />
                      </TableCell>
                      <TableCell className="min-w-[80px]">
                        <Skeleton className="h-4 w-8" />
                      </TableCell>
                      <TableCell className="min-w-[90px]">
                        <Skeleton className="h-4 w-8" />
                      </TableCell>
                      <TableCell className="min-w-[90px]">
                        <Skeleton className="h-4 w-8" />
                      </TableCell>
                      <TableCell className="min-w-[100px]">
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell className="text-right min-w-[280px] sm:min-w-[320px]">
                        <div className="flex justify-end gap-2 flex-wrap">
                          <Skeleton className="h-8 w-20 rounded-full" />
                          <Skeleton className="h-8 w-20 rounded-full" />
                          <Skeleton className="h-8 w-20 rounded-full" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  filteredReports.map((report) => (
                    <TableRow key={report.userId}>
                      <TableCell className="font-medium min-w-[200px] sm:min-w-[250px]">
                        <div className="flex items-center gap-2">
                          <Avatar
                            alt={report.userName}
                            fallback={report.userName[0]}
                            className="h-8 w-8 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{report.userName}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {report.userEmail}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[80px]">{report.totalOpened}</TableCell>
                      <TableCell className="min-w-[80px]">{report.totalClosed}</TableCell>
                      <TableCell className="min-w-[90px]">{report.totalUnclosed}</TableCell>
                      <TableCell className="min-w-[90px]">{report.totalUnopened}</TableCell>
                      <TableCell className="font-semibold min-w-[100px]">
                        Rs {report.totalFine.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right min-w-[280px] sm:min-w-[320px]">
                        <div className="flex justify-end gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFineAction(report, "pay")}
                            disabled={report.totalFine === 0}
                            className="rounded-full whitespace-nowrap"
                          >
                            Pay Fine
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFineAction(report, "reduce")}
                            disabled={report.totalFine === 0}
                            className="rounded-full whitespace-nowrap"
                          >
                            Reduce
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFineAction(report, "waive")}
                            disabled={report.totalFine === 0}
                            className="rounded-full whitespace-nowrap"
                          >
                            Waive
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Fine Action Dialog */}
      <Dialog open={fineDialogOpen} onOpenChange={setFineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {fineAction === "pay"
                ? "Pay Fine"
                : fineAction === "reduce"
                  ? "Reduce Fine"
                  : "Waive Fine"}
            </DialogTitle>
            <DialogDescription>
              {fineAction === "pay" &&
                `Mark fine as paid for ${selectedUser?.userName}. This will set all fines to 0.`}
              {fineAction === "reduce" &&
                `Reduce fine amount for ${selectedUser?.userName}. Current fine: Rs ${selectedUser?.totalFine.toFixed(2)}`}
              {fineAction === "waive" &&
                `Waive all fines for ${selectedUser?.userName}. This will set all fines to 0.`}
            </DialogDescription>
          </DialogHeader>
          {fineAction === "reduce" && (
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">
                Amount to Reduce (Rs)
              </label>
              <Input
                id="amount"
                type="number"
                value={fineAmount}
                onChange={(e) => setFineAmount(e.target.value)}
                placeholder="Enter amount"
                min="0"
                max={selectedUser?.totalFine}
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setFineDialogOpen(false);
                setSelectedUser(null);
                setFineAction(null);
                setFineAmount("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={processFineAction}
              disabled={processingFine || (fineAction === "reduce" && !fineAmount)}
            >
              {processingFine ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
