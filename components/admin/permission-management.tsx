"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getAllAdminPermissions,
  updateAdminPermissions,
  AdminPermissionsData,
} from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Search, Save, RefreshCw } from "lucide-react";
import { ADMIN_MODULES, AdminModule, MODULE_ROUTES } from "@/lib/utils/permissions";
import { Avatar } from "@/components/ui/avatar";

// Module display names
const MODULE_DISPLAY_NAMES: Record<AdminModule, string> = {
  dashboard: "Dashboard",
  menu: "Menu",
  mark_attendance: "Mark Attendance",
  view_attendance: "View Attendance",
  guests: "Guest Management",
  view_reports: "View Reports",
  payments: "Payments",
  off_days: "Off Days",
  feedback: "Feedback Management",
  send_notifications: "Send Notifications",
  settings: "Settings",
};

export function PermissionManagement() {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionsData, setPermissionsData] = useState<AdminPermissionsData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [localPermissions, setLocalPermissions] = useState<
    Record<string, Record<AdminModule, boolean>>
  >({});

  const loadPermissions = async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getAllAdminPermissions(currentUser);
      setPermissionsData(data.permissions);
      
      // Initialize local permissions state
      const local: Record<string, Record<AdminModule, boolean>> = {};
      data.permissions.forEach((perm) => {
        local[perm.adminId] = {} as Record<AdminModule, boolean>;
        ADMIN_MODULES.forEach((module) => {
          local[perm.adminId][module] = perm.permissions[module] ?? false;
        });
      });
      setLocalPermissions(local);
    } catch (err: any) {
      setError(err.message || "Failed to load permissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, [currentUser]);

  const handleTogglePermission = (adminId: string, module: AdminModule, checked: boolean) => {
    setLocalPermissions((prev) => ({
      ...prev,
      [adminId]: {
        ...prev[adminId],
        [module]: checked,
      },
    }));
  };

  const handleSavePermissions = async (adminId: string) => {
    if (!currentUser) return;

    setSaving((prev) => new Set(prev).add(adminId));

    try {
      const permissions = localPermissions[adminId] || {};
      await updateAdminPermissions(adminId, permissions, currentUser);
      
      // Update the main permissions data
      setPermissionsData((prev) =>
        prev.map((perm) =>
          perm.adminId === adminId
            ? { ...perm, permissions: { ...permissions } }
            : perm
        )
      );
      
      // Trigger a page refresh to update sidebar and other components
      // This will cause all components using useAdminPermissions to refresh
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("adminPermissionsUpdated", { detail: { adminId } }));
      }
    } catch (err: any) {
      setError(err.message || "Failed to update permissions");
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(adminId);
        return next;
      });
    }
  };

  const filteredAdmins = permissionsData.filter((perm) => {
    const query = searchQuery.toLowerCase();
    return (
      perm.adminName.toLowerCase().includes(query) ||
      perm.adminEmail.toLowerCase().includes(query)
    );
  });

  if (loading) {
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

  if (error) {
    return (
      <div className="rounded-md border border-destructive bg-destructive/10 p-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p className="font-semibold">Error</p>
        </div>
        <p className="mt-2 text-sm text-destructive">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={loadPermissions}
          className="mt-4"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Permissions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage module access permissions for admin users
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadPermissions}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search admins by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAdmins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No admin users found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredAdmins.map((perm) => (
                <Card key={perm.adminId} className="border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar
                          alt={perm.adminName}
                          fallback={perm.adminName[0]?.toUpperCase() || "A"}
                        />
                        <div>
                          <CardTitle className="text-base">{perm.adminName}</CardTitle>
                          <p className="text-sm text-muted-foreground">{perm.adminEmail}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSavePermissions(perm.adminId)}
                        disabled={saving.has(perm.adminId)}
                      >
                        {saving.has(perm.adminId) ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {ADMIN_MODULES.map((module) => {
                        const isAllowed =
                          localPermissions[perm.adminId]?.[module] ??
                          perm.permissions[module] ??
                          false;
                        return (
                          <div
                            key={module}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card"
                          >
                            <div className="flex-1">
                              <Label
                                htmlFor={`${perm.adminId}-${module}`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                {MODULE_DISPLAY_NAMES[module]}
                              </Label>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {MODULE_ROUTES[module]}
                              </p>
                            </div>
                            <Switch
                              id={`${perm.adminId}-${module}`}
                              checked={isAllowed}
                              onCheckedChange={(checked) =>
                                handleTogglePermission(perm.adminId, module, checked)
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

