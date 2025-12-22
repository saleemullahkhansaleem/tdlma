"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  UtensilsCrossed,
  CheckCircle2,
  Users,
  AlertTriangle,
  UserCircle,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface DashboardOperationalProps {
  operational: {
    openMeals: number;
    closedMeals: number;
    usersWithUnpaidBalances: number;
    topUsersByDues: Array<{
      userId: string;
      userName: string;
      dues: number;
    }>;
    recentGuests: Array<{
      id: string;
      name: string;
      date: string;
      inviterName: string;
    }>;
    recentFines: Array<{
      userId: string;
      userName: string;
      amount: number;
      date: string;
    }>;
  };
}

export function DashboardOperational({ operational }: DashboardOperationalProps) {
  const formatCurrency = (value: number) => {
    return `Rs. ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return dateString;
    }
  };

  const totalMeals = operational.openMeals + operational.closedMeals;
  const closedPercentage = totalMeals > 0 ? (operational.closedMeals / totalMeals) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Operational Insights</CardTitle>
          <CardDescription>Key operational metrics and recent activities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Open vs Closed Meals */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Meal Status (Today)</h3>
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {operational.openMeals} Open / {operational.closedMeals} Closed
                </span>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4 bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Open Meals</span>
                  <UtensilsCrossed className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-2xl font-bold">{operational.openMeals}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Meals not yet closed today
                </p>
              </div>
              <div className="rounded-lg border p-4 bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Closed Meals</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {operational.closedMeals}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {closedPercentage.toFixed(1)}% of total meals
                </p>
              </div>
            </div>
          </div>

          {/* Users with Unpaid Balances */}
          <div className="rounded-lg border p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <div className="font-semibold text-amber-900 dark:text-amber-100">
                    Users with Unpaid Balances
                  </div>
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    {operational.usersWithUnpaidBalances} user(s) have outstanding dues
                  </div>
                </div>
              </div>
              <Link href="/admin/payments">
                <Button variant="outline" size="sm">
                  View Payments
                </Button>
              </Link>
            </div>
          </div>

          {/* Top Users by Dues */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Top Users by Dues</h3>
              <Link href="/admin/payments">
                <Button variant="ghost" size="sm" className="text-xs">
                  View All →
                </Button>
              </Link>
            </div>
            {operational.topUsersByDues.length > 0 ? (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead className="text-right">Dues</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operational.topUsersByDues.map((user, index) => (
                      <TableRow key={user.userId}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{user.userName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={user.dues > 1000 ? "destructive" : "outline"}>
                            {formatCurrency(user.dues)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                No outstanding dues
              </div>
            )}
          </div>

          {/* Recent Activities Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Guests */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Recent Guest Additions</h3>
                <Link href="/admin/view-attendance">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View All →
                  </Button>
                </Link>
              </div>
              <div className="rounded-lg border">
                {operational.recentGuests.length > 0 ? (
                  <div className="divide-y">
                    {operational.recentGuests.map((guest) => (
                      <div key={guest.id} className="p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="font-medium text-sm truncate">{guest.name}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>by {guest.inviterName}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(guest.date)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No recent guests
                  </div>
                )}
              </div>
            </div>

            {/* Recent Fines */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Recent Fines</h3>
                <Link href="/admin/view-attendance">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View All →
                  </Button>
                </Link>
              </div>
              <div className="rounded-lg border">
                {operational.recentFines.length > 0 ? (
                  <div className="divide-y">
                    {operational.recentFines.map((fine, index) => (
                      <div key={`${fine.userId}-${fine.date}-${index}`} className="p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                              <span className="font-medium text-sm truncate">{fine.userName}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(fine.date)}
                              </span>
                            </div>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {formatCurrency(fine.amount)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No recent fines
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
