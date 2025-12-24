"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCircle2 } from "lucide-react";
import { Notification } from "@/lib/types/notification";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { getNotificationRoute } from "@/lib/utils/notification-routes";

export default function AdminNotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await fetch("/api/notifications", {
          headers: {
            "x-user-id": user.id,
            "x-user-email": user.email,
            "x-user-name": user.name,
            "x-user-role": user.role,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to fetch notifications");
        const data = await response.json();
        setNotifications(data || []);
      } catch (error) {
        console.error("Failed to load notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    // Poll every 30 seconds
    const interval = setInterval(loadNotifications, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: {
          "x-user-id": user.id,
          "x-user-email": user.email,
          "x-user-name": user.name,
          "x-user-role": user.role,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ read: true }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      await Promise.all(
        notifications
          .filter((n) => !n.read)
          .map((n) =>
            fetch(`/api/notifications/${n.id}`, {
              method: "PATCH",
              headers: {
                "x-user-id": user.id,
                "x-user-email": user.email,
                "x-user-name": user.name,
                "x-user-role": user.role,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ read: true }),
            })
          )
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Notifications
          </h2>
          <p className="text-sm text-muted-foreground">
            View all your notifications
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCircle2 className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Notifications</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="font-medium">No notifications</p>
              <p className="text-sm mt-2">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const route = user ? getNotificationRoute(notification.type, user.role) : null;
                return (
                  <div
                    key={notification.id}
                    className={`p-3 sm:p-4 rounded-lg border transition-colors ${
                      !notification.read
                        ? "bg-primary/5 border-primary/20"
                        : "bg-muted/30 border-border"
                    } ${route ? "cursor-pointer hover:shadow-md" : ""}`}
                    onClick={async () => {
                      // Mark as read if unread
                      if (!notification.read) {
                        await markAsRead(notification.id);
                      }
                      
                      // Navigate if route exists
                      if (route) {
                        router.push(route);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 sm:gap-4">
                      <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="font-semibold text-sm break-words">{notification.title}</p>
                            {!notification.read && (
                              <Badge variant="soft" className="text-xs shrink-0">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground break-words">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await markAsRead(notification.id);
                          }}
                          className="shrink-0"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
