"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { MessageSquare, AlertCircle, CheckCircle2, Clock, UserCircle } from "lucide-react";
import Link from "next/link";

interface DashboardFeedbackProps {
  feedback: {
    newCount: number;
    pendingCount: number;
    recentFeedback: Array<{
      id: string;
      title: string;
      status: string;
      userName: string;
      createdAt: string;
    }>;
  };
}

export function DashboardFeedback({ feedback }: DashboardFeedbackProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return dateString;
    }
  };

  const getStatusVariant = (status: string): "default" | "success" | "outline" => {
    switch (status) {
      case "Resolved":
        return "success";
      case "Reviewed":
        return "default";
      case "Pending":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Resolved":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "Reviewed":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "Pending":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const hasPendingFeedback = feedback.pendingCount > 0;
  const hasNewFeedback = feedback.newCount > 0;

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Feedback & Alerts</CardTitle>
          <CardDescription>User feedback summary and alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Feedback Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Pending Feedback</span>
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold">{feedback.pendingCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
            </div>

            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">New Feedback (7 days)</span>
                <MessageSquare className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">{feedback.newCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Recent submissions</p>
            </div>

            <div className="rounded-lg border p-4 bg-muted/30 flex items-center justify-center">
              <Link href="/admin/feedback" className="w-full">
                <Button variant="outline" className="w-full">
                  View All Feedback
                </Button>
              </Link>
            </div>
          </div>

          {/* Critical Alerts */}
          {(hasPendingFeedback || hasNewFeedback) && (
            <div className="rounded-lg border p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                    Feedback Requires Attention
                  </div>
                  <div className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                    {hasPendingFeedback && (
                      <p>
                        {feedback.pendingCount} pending feedback item{feedback.pendingCount !== 1 ? "s" : ""} need{" "}
                        {feedback.pendingCount !== 1 ? "responses" : "a response"}.
                      </p>
                    )}
                    {hasNewFeedback && (
                      <p>
                        {feedback.newCount} new feedback item{feedback.newCount !== 1 ? "s" : ""} submitted in the last 7 days.
                      </p>
                    )}
                  </div>
                  <Link href="/admin/feedback" className="inline-block mt-3">
                    <Button variant="outline" size="sm" className="bg-background">
                      Review Feedback →
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Recent Feedback */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Recent Feedback</h3>
              <Link href="/admin/feedback">
                <Button variant="ghost" size="sm" className="text-xs">
                  View All →
                </Button>
              </Link>
            </div>
            <div className="rounded-lg border">
              {feedback.recentFeedback.length > 0 ? (
                <div className="divide-y">
                  {feedback.recentFeedback.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusIcon(item.status)}
                            <span className="font-medium text-sm truncate">{item.title}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <UserCircle className="h-3 w-3" />
                            <span>{item.userName}</span>
                            <span>•</span>
                            <span>{formatDate(item.createdAt)}</span>
                          </div>
                        </div>
                        <Badge variant={getStatusVariant(item.status)}>
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No recent feedback
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
