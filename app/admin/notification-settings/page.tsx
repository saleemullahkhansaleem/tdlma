"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertCircle, CheckCircle2, Mail, Users, Shield, UserCog, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { getIcon } from "@/lib/utils/icon-mapper";
import { cn } from "@/lib/utils";

interface NotificationPreference {
  id: string;
  notificationType: string;
  description: string;
  recipientType: string;
  iconId?: string | null;
  enabled: boolean;
  sendEmail: boolean;
  createdAt: Date;
  updatedAt: Date;
  icon?: {
    id: string;
    name: string;
    iconName: string;
  } | null;
}

type RecipientType = "all" | "user" | "admin" | "super_admin";

const RECIPIENT_TYPE_CONFIG: Record<RecipientType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  all: { label: "All Users", icon: Users, color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  user: { label: "Users", icon: Users, color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
  admin: { label: "Admins", icon: Shield, color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
  super_admin: { label: "Super Admins", icon: UserCog, color: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
};

export default function NotificationSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRecipientType, setFilterRecipientType] = useState<RecipientType | "all">("all");
  const [updatingPreferences, setUpdatingPreferences] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace("/login");
      } else if (user.role !== "super_admin") {
        router.replace("/admin/dashboard");
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === "super_admin") {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/notification-preferences", {
        headers: {
          "x-user-id": user.id,
          "x-user-email": user.email,
          "x-user-name": user.name,
          "x-user-role": user.role,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load notification preferences");
      }

      const data = await response.json();
      setPreferences(data);
    } catch (err: any) {
      setError(err.message || "Failed to load notification preferences");
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (
    notificationType: string,
    field: "enabled" | "sendEmail",
    value: boolean
  ) => {
    if (!user) return;

    // Prevent multiple simultaneous updates for the same preference
    if (updatingPreferences.has(notificationType)) {
      return;
    }

    // Mark as updating
    setUpdatingPreferences((prev) => new Set(prev).add(notificationType));

    // Find current preference from state BEFORE optimistic update
    const currentPreference = preferences.find(
      (p) => p.notificationType === notificationType
    );

    if (!currentPreference) {
      setUpdatingPreferences((prev) => {
        const next = new Set(prev);
        next.delete(notificationType);
        return next;
      });
      setError("Preference not found");
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Store previous state for rollback
    const previousState: NotificationPreference = { ...currentPreference };

    // Create updated preference
    const updatedPreference: NotificationPreference = {
      ...currentPreference,
      [field]: value,
    };

    // Optimistic update - update UI immediately
    setPreferences((prev) =>
      prev.map((p) =>
        p.notificationType === notificationType ? updatedPreference : p
      )
    );

    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/notification-preferences", {
        method: "PATCH",
        headers: {
          "x-user-id": user.id,
          "x-user-email": user.email,
          "x-user-name": user.name,
          "x-user-role": user.role,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationType,
          enabled: updatedPreference.enabled,
          sendEmail: updatedPreference.sendEmail,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update notification preference");
      }

      const updated = await response.json();
      
      // Update with server response to ensure consistency
      setPreferences((prev) =>
        prev.map((p) =>
          p.notificationType === notificationType
            ? {
                ...updated,
                icon: updated.icon || p.icon,
                recipientType: updated.recipientType || p.recipientType,
              }
            : p
        )
      );

      setSuccess("Notification preference updated successfully");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      // Revert optimistic update on error
      setPreferences((prev) =>
        prev.map((p) =>
          p.notificationType === notificationType ? previousState : p
        )
      );
      setError(err.message || "Failed to update notification preference");
      setTimeout(() => setError(null), 3000);
    } finally {
      // Remove from updating set
      setUpdatingPreferences((prev) => {
        const next = new Set(prev);
        next.delete(notificationType);
        return next;
      });
    }
  };

  // Filter and search preferences
  const filteredPreferences = useMemo(() => {
    return preferences.filter((pref) => {
      const matchesSearch =
        !searchQuery ||
        pref.notificationType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pref.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRecipientType =
        filterRecipientType === "all" || pref.recipientType === filterRecipientType;

      return matchesSearch && matchesRecipientType;
    });
  }, [preferences, searchQuery, filterRecipientType]);

  // Group preferences by recipient type
  const groupedPreferences = useMemo(() => {
    const groups: Record<string, NotificationPreference[]> = {
      all: [],
      user: [],
      admin: [],
      super_admin: [],
    };

    filteredPreferences.forEach((pref) => {
      const type = (pref.recipientType || "all") as RecipientType;
      if (groups[type]) {
        groups[type].push(pref);
      } else {
        groups.all.push(pref);
      }
    });

    return groups;
  }, [filteredPreferences]);

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user || user.role !== "super_admin") {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Notification Settings
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure notification preferences for all system actions. Control which notifications are sent and whether emails are included.
          </p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
            {success}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "user", "admin", "super_admin"] as const).map((type) => {
                const config = RECIPIENT_TYPE_CONFIG[type];
                const IconComponent = config.icon;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFilterRecipientType(type)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                      filterRecipientType === type
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    <IconComponent className="h-3 w-3" />
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      {filteredPreferences.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No notification preferences found matching your filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {(["all", "user", "admin", "super_admin"] as RecipientType[]).map((recipientType) => {
            const group = groupedPreferences[recipientType];
            if (group.length === 0) return null;

            const config = RECIPIENT_TYPE_CONFIG[recipientType];
            const IconComponent = config.icon;

            return (
              <Card key={recipientType}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">{config.label}</CardTitle>
                      <Badge variant="outline" className="ml-2">
                        {group.length}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>
                    Notifications sent to {config.label.toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {group.map((pref) => {
                      const IconComponent = pref.icon?.iconName
                        ? getIcon(pref.icon.iconName)
                        : Bell;
                      return (
                        <div
                          key={pref.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-all group"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="shrink-0">
                              <IconComponent className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Label className="truncate">
                                  {pref.notificationType
                                    .replace(/_/g, " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                </Label>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {pref.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 ml-4 shrink-0">
                            {/* Enable/Disable Notification */}
                            <div className="flex flex-col items-center gap-1.5">
                              <Label
                                htmlFor={`notify-${pref.id}`}
                                className="text-xs text-muted-foreground"
                              >
                                Notification
                              </Label>
                              <Switch
                                id={`notify-${pref.id}`}
                                checked={pref.enabled}
                                disabled={updatingPreferences.has(pref.notificationType)}
                                onCheckedChange={(checked) =>
                                  updatePreference(pref.notificationType, "enabled", checked)
                                }
                                className="transition-all"
                              />
                            </div>

                            {/* Enable/Disable Email */}
                            <div className="flex flex-col items-center gap-1.5">
                              <Label
                                htmlFor={`email-${pref.id}`}
                                className="text-xs text-muted-foreground flex items-center gap-1"
                              >
                                <Mail className="h-3 w-3" />
                                Email
                              </Label>
                              <Switch
                                id={`email-${pref.id}`}
                                checked={pref.sendEmail && pref.enabled}
                                disabled={!pref.enabled || updatingPreferences.has(pref.notificationType)}
                                onCheckedChange={(checked) =>
                                  updatePreference(pref.notificationType, "sendEmail", checked)
                                }
                                className="transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
