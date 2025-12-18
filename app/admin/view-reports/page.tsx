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
import { Search, BarChart2, Download } from "lucide-react";

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
  guestCount: number;
  guestExpense: number;
  baseExpense: number;
  totalDues: number;
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
  totalGuests: number;
  totalGuestExpenses: number;
  totalBaseExpenses: number;
  totalDues: number;
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
    totalGuests: 0,
    totalGuestExpenses: 0,
    totalBaseExpenses: 0,
    totalDues: 0,
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

  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const loadReports = async () => {
    if (!user || !startDate || !endDate) return;

    setLoading(true);
    try {
      const startDateStr = getLocalDateString(startDate);
      const endDateStr = getLocalDateString(endDate);

      const response = await fetch(
        `/api/admin/reports?startDate=${startDateStr}&endDate=${endDateStr}`,
        {
          headers: {
            "x-user-id": user.id,
            "x-user-email": user.email,
            "x-user-name": user.name,
            "x-user-role": user.role,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch reports");
      }

      const data = await response.json();
      setUserReports(data.reports || []);
      setStats(data.stats || {
        totalDays: 0,
        workDays: 0,
        sundays: 0,
        totalUsers: 0,
        totalFine: 0,
        totalOpened: 0,
        totalClosed: 0,
        totalUnopened: 0,
        totalUnclosed: 0,
        totalGuests: 0,
        totalGuestExpenses: 0,
        totalBaseExpenses: 0,
        totalDues: 0,
      });
    } catch (error) {
      console.error("Failed to load reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [user, startDate, endDate]);

  const exportToCSV = () => {
    if (userReports.length === 0) return;

    const headers = [
      "Name",
      "Email",
      "Opened",
      "Closed",
      "Unclosed",
      "Unopened",
      "Total Fine (Rs)",
      "Guests",
      "Guest Expense (Rs)",
      "Base Expense (Rs)",
      "Total Dues (Rs)",
    ];

    const rows = userReports.map((report) => [
      report.userName,
      report.userEmail,
      report.totalOpened.toString(),
      report.totalClosed.toString(),
      report.totalUnclosed.toString(),
      report.totalUnopened.toString(),
      report.totalFine.toFixed(2),
      report.guestCount.toString(),
      report.guestExpense.toFixed(2),
      report.baseExpense.toFixed(2),
      report.totalDues.toFixed(2),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `reports_${getLocalDateString(startDate!)}_${getLocalDateString(endDate!)}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            View attendance reports and financial details for users
          </p>
        </div>
        <Button onClick={exportToCSV} disabled={loading || userReports.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
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
      <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
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
                  {stats.totalDues.toFixed(0)}
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  Total Dues (Rs)
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
                  {stats.totalGuests}
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  Total Guests
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
                  {stats.totalGuestExpenses.toFixed(0)}
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  Guest Expenses (Rs)
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
                  {stats.totalBaseExpenses.toFixed(0)}
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  Base Expenses (Rs)
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
                  <TableHead className="min-w-[80px]">Guests</TableHead>
                  <TableHead className="min-w-[120px]">Guest Expense</TableHead>
                  <TableHead className="min-w-[120px]">Base Expense</TableHead>
                  <TableHead className="min-w-[120px]">Total Dues</TableHead>
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
                      <TableCell className="min-w-[80px]">
                        <Skeleton className="h-4 w-8" />
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        <Skeleton className="h-4 w-16" />
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
                      <TableCell className="min-w-[80px]">{report.guestCount}</TableCell>
                      <TableCell className="min-w-[120px]">
                        Rs {report.guestExpense.toFixed(2)}
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        Rs {report.baseExpense.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-semibold min-w-[120px]">
                        Rs {report.totalDues.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

    </div>
  );
}
