"use client";

import { useState, useEffect, useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateFilter } from "@/components/admin/date-filter";
import { getAttendance, getGuests, updateAttendance } from "@/lib/api/client";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useAdminPermissions } from "@/lib/hooks/use-admin-permissions";
import { AttendanceWithUser } from "@/lib/types/attendance";
import { Guest } from "@/lib/types/guest";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle2, XCircle, AlertCircle, Inbox, Mail, UserPlus, DollarSign } from "lucide-react";
import { calculateRemark } from "@/lib/utils";

interface UserItem {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  attendanceId?: string | null;
  isOpen?: boolean;
}

const StatusColumn = memo(function StatusColumn({
  title,
  color,
  items,
  loading = false,
  icon: Icon,
  onToggleOpenClose,
  selectedDate,
  togglingIds,
}: {
  title: string;
  color: "green" | "red" | "orange";
  items: UserItem[];
  loading?: boolean;
  icon?: React.ElementType;
  onToggleOpenClose?: (attendanceId: string, currentIsOpen: boolean, userId: string) => void;
  selectedDate?: string;
  togglingIds?: Set<string>;
}) {
  const border =
    color === "green"
      ? "border-primary/20"
      : color === "red"
        ? "border-destructive/20"
        : "border-secondary/20";

  const headerBg =
    color === "green"
      ? "bg-primary/10 text-primary"
      : color === "red"
        ? "bg-destructive/10 text-destructive"
        : "bg-secondary/10 text-secondary";

  const isEmpty = !loading && items.length === 0;

  return (
    <Card className={`rounded-lg border-2 ${border} hover:shadow-md transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          {Icon && (
            <div className={`p-1.5 rounded-md ${headerBg.replace("/10", "/20")}`}>
              <Icon className={`h-6 w-6 ${color === "green"
                ? "text-primary"
                : color === "red"
                  ? "text-destructive"
                  : "text-secondary"
                }`} />
            </div>
          )}
          <div className="flex-1">
            <div
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${headerBg}`}
            >
              {title}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {loading ? "Loading..." : `${items.length} ${items.length === 1 ? "person" : "people"}`}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-xs text-muted-foreground">No data available</p>
          </div>
        ) : (
          <div className="space-y-1 max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-muted/30 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
            {items.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-1 rounded-lg bg-muted/50 hover:bg-muted transition-all duration-200 hover:shadow-sm group"
              >
                <Avatar
                  alt={user.name}
                  fallback={user.name[0]?.toUpperCase() || "?"}
                  src={user.avatarUrl || undefined}
                  className="h-10 w-10 shrink-0 border-2 border-background"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-foreground capitalize tracking-tight truncate">
                    {user.name}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-[11px] text-muted-foreground truncate">
                      {user.email}
                    </span>
                  </div>
                </div>
                {onToggleOpenClose && user.attendanceId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onToggleOpenClose(user.attendanceId!, user.isOpen ?? true, user.id)}
                    disabled={togglingIds?.has(user.attendanceId)}
                    className="h-7 px-2 text-xs shrink-0"
                  >
                    {togglingIds?.has(user.attendanceId) ? (
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      user.isOpen ? "Close" : "Open"
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
StatusColumn.displayName = "StatusColumn";

const StatusColumnSkeleton = memo(function StatusColumnSkeleton() {
  return (
    <Card className="rounded-lg border-2 border-border">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-7 w-7 rounded-md" />
          <div className="flex-1">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-3 w-20 mt-1.5" />
          </div>
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
StatusColumnSkeleton.displayName = "StatusColumnSkeleton";

export default function ViewAttendancePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();

  useEffect(() => {
    if (!permissionsLoading && user) {
      if (user.role === "admin" && !hasPermission("view_attendance")) {
        router.replace("/admin/dashboard");
      }
    }
  }, [user, hasPermission, permissionsLoading, router]);

  // Get today's date in local timezone (YYYY-MM-DD format)
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(
    getLocalDateString(new Date())
  );
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<AttendanceWithUser[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loadingGuests, setLoadingGuests] = useState(true);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    const loadAttendance = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const data = await getAttendance(user, {
          date: selectedDate,
          mealType: "Lunch",
        });

        if (!cancelled) {
          setAttendance(data);
        }
      } catch (error) {
        console.error("Failed to load attendance:", error);
        if (!cancelled) {
          setAttendance([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const loadGuests = async () => {
      if (!user) return;

      setLoadingGuests(true);
      try {
        const guestsData = await getGuests(user, {
          date: selectedDate,
          mealType: "Lunch",
        });

        if (!cancelled) {
          setGuests(guestsData);
        }
      } catch (error) {
        console.error("Failed to load guests:", error);
        if (!cancelled) {
          setGuests([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingGuests(false);
        }
      }
    };

    loadAttendance();
    loadGuests();

    return () => {
      cancelled = true;
    };
  }, [user, selectedDate]);

  const handleToggleOpenClose = async (attendanceId: string, currentIsOpen: boolean, userId: string) => {
    if (!user) return;

    setTogglingIds((prev) => new Set(prev).add(attendanceId));

    try {
      const newIsOpen = !currentIsOpen;

      // Optimistically update local state
      setAttendance((prev) =>
        prev.map((a) =>
          a.id === attendanceId
            ? { ...a, isOpen: newIsOpen }
            : a
        )
      );

      // Update in the background
      await updateAttendance(attendanceId, { isOpen: newIsOpen }, user);
    } catch (error) {
      console.error("Failed to toggle open/close:", error);
      // Reload attendance on error
      const data = await getAttendance(user, {
        date: selectedDate,
        mealType: "Lunch",
      });
      setAttendance(data);
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(attendanceId);
        return next;
      });
    }
  };

  // Optimized filtering with useMemo - only recalculates when attendance changes
  const filteredUsers = useMemo(() => {
    const allClearPresent: UserItem[] = [];
    const allClearAbsent: UserItem[] = [];
    const unclosed: UserItem[] = [];
    const unopened: UserItem[] = [];

    attendance.forEach((a) => {
      const userItem: UserItem = {
        id: a.user.id,
        name: a.user.name,
        email: a.user.email,
        avatarUrl: a.user.avatarUrl,
        attendanceId: a.id,
        isOpen: a.isOpen ?? true,
      };

      // Calculate remark from status and isOpen (computed, not stored)
      const status = a.status === "Present" || a.status === "Absent" ? a.status : null;
      const isOpen = a.isOpen ?? true;
      const remark = calculateRemark(status, isOpen);

      if (remark === "All Clear") {
        if (status === "Present") {
          allClearPresent.push(userItem);
        } else if (status === "Absent") {
          allClearAbsent.push(userItem);
        }
      } else if (remark === "Unclosed") {
        unclosed.push(userItem);
      } else if (remark === "Unopened") {
        unopened.push(userItem);
      }
    });

    return { allClearPresent, allClearAbsent, unclosed, unopened };
  }, [attendance]);

  const totalUsers = useMemo(
    () =>
      filteredUsers.allClearPresent.length +
      filteredUsers.allClearAbsent.length +
      filteredUsers.unclosed.length +
      filteredUsers.unopened.length,
    [filteredUsers]
  );

  const isEmpty = !loading && totalUsers === 0;

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            View Attendance
          </h2>
          <p className="text-sm text-muted-foreground">
            View attendance status by category for the selected date
          </p>
          {!loading && !isEmpty && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                Total: <span className="font-semibold text-foreground">{totalUsers}</span> {totalUsers === 1 ? "person" : "people"}
              </span>
              <span className="text-primary">
                Present: <span className="font-semibold">{filteredUsers.allClearPresent.length + filteredUsers.unopened.length}</span>
              </span>
              <span className="text-secondary">
                Absent: <span className="font-semibold">{filteredUsers.allClearAbsent.length + filteredUsers.unclosed.length}</span>
              </span>
            </div>
          )}
        </div>
        <DateFilter
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </div>

      {/* Empty State */}
      {isEmpty && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No attendance data</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              There is no attendance data available for the selected date.
              Try selecting a different date or check back later.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Status Columns */}
      {!isEmpty && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              <StatusColumnSkeleton />
              <StatusColumnSkeleton />
              <StatusColumnSkeleton />
              <StatusColumnSkeleton />
            </>
          ) : (
            <>
              <StatusColumn
                title="All Clear (Present)"
                color="green"
                items={filteredUsers.allClearPresent}
                loading={loading}
                icon={CheckCircle2}
                onToggleOpenClose={handleToggleOpenClose}
                selectedDate={selectedDate}
                togglingIds={togglingIds}
              />
              <StatusColumn
                title="All Clear (Absent)"
                color="green"
                items={filteredUsers.allClearAbsent}
                loading={loading}
                icon={XCircle}
                onToggleOpenClose={handleToggleOpenClose}
                selectedDate={selectedDate}
                togglingIds={togglingIds}
              />
              <StatusColumn
                title="Unclosed"
                color="red"
                items={filteredUsers.unclosed}
                loading={loading}
                icon={AlertCircle}
                onToggleOpenClose={handleToggleOpenClose}
                selectedDate={selectedDate}
                togglingIds={togglingIds}
              />
              <StatusColumn
                title="Unopened"
                color="orange"
                items={filteredUsers.unopened}
                loading={loading}
                icon={Inbox}
                onToggleOpenClose={handleToggleOpenClose}
                selectedDate={selectedDate}
                togglingIds={togglingIds}
              />
            </>
          )}
        </section>
      )}

      {/* Guests List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Guests for {selectedDate}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingGuests ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : guests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No guests for this date</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" />
                  <span className="font-semibold">
                    Total Guests: {guests.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-600">
                    Total Expense: {guests.reduce((sum, g) => sum + parseFloat(g.amount?.toString() || "0"), 0).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {guests.map((guest) => {
                  // Find inviter from attendance data
                  const inviter = attendance.find((a) => a.userId === guest.inviterId);
                  return (
                    <div
                      key={guest.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserPlus className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{guest.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Invited by: {inviter?.user.name || "Unknown"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm text-green-600">
                          {parseFloat(guest.amount?.toString() || "0").toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {guest.mealType}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
