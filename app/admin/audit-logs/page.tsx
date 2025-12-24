"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Search, Filter, Trash2, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, any> | null;
  createdAt: Date;
  userName: string | null;
  userEmail: string | null;
}

const ENTITY_TYPES = [
  "all",
  "user",
  "attendance",
  "guest",
  "settings",
  "menu",
  "feedback",
] as const;

export default function AuditLogsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchAction, setSearchAction] = useState("");
  const [selectedEntityType, setSelectedEntityType] = useState<string>("all");
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if user is super admin
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
    if (!user || user.role !== "super_admin") return;

    const loadAuditLogs = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (searchAction) params.set("action", searchAction);
        if (selectedEntityType && selectedEntityType !== "all") {
          params.set("entityType", selectedEntityType);
        }
        params.set("limit", "100");

        const response = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
          headers: {
            "x-user-id": user.id,
            "x-user-email": user.email,
            "x-user-name": user.name,
            "x-user-role": user.role,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch audit logs: ${response.status}`);
        }

        const data = await response.json();
        setLogs(data.logs || []);
        
        // Show message if table doesn't exist (handled in UI)
      } catch (error) {
        console.error("Failed to load audit logs:", error);
        // Set empty logs on error to show empty state
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    loadAuditLogs();
  }, [user, searchAction, selectedEntityType, router]);

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString();
  };

  const toggleLogSelection = (logId: string) => {
    setSelectedLogs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedLogs.size === logs.length) {
      setSelectedLogs(new Set());
    } else {
      setSelectedLogs(new Set(logs.map((log) => log.id)));
    }
  };

  const handleDelete = async () => {
    if (!user || selectedLogs.size === 0) return;

    setDeleteLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/audit-logs", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
          "x-user-email": user.email,
          "x-user-name": user.name,
          "x-user-role": user.role,
        },
        body: JSON.stringify({
          ids: Array.from(selectedLogs),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete audit logs");
      }

      const data = await response.json();
      setSuccess(data.message || "Audit logs deleted successfully");
      setSelectedLogs(new Set());
      setDeleteDialogOpen(false);

      // Reload audit logs
      const params = new URLSearchParams();
      if (searchAction) params.set("action", searchAction);
      if (selectedEntityType && selectedEntityType !== "all") {
        params.set("entityType", selectedEntityType);
      }
      params.set("limit", "100");

      const reloadResponse = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        headers: {
          "x-user-id": user.id,
          "x-user-email": user.email,
          "x-user-name": user.name,
          "x-user-role": user.role,
          "Content-Type": "application/json",
        },
      });

      if (reloadResponse.ok) {
        const reloadData = await reloadResponse.json();
        setLogs(reloadData.logs || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete audit logs");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (authLoading) {
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Audit Logs
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            View all administrative actions performed by Admin and Super Admin users
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-wrap gap-2 p-4 border-b">
            {ENTITY_TYPES.map((type) => (
              <Button
                key={type}
                variant={selectedEntityType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedEntityType(type)}
                className="rounded-full"
              >
                {type === "all"
                  ? "All"
                  : type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Success/Error Messages */}
      {success && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
            {success}
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-auto"
            onClick={() => setSuccess(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm font-medium text-destructive">{error}</p>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-auto"
            onClick={() => setError(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label className="pl-4 block">Action</Label>
                  <Input
                    placeholder="Filter by action (e.g., CREATE_USER)"
                    value={searchAction}
                    onChange={(e) => setSearchAction(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Audit Logs</CardTitle>
                {selectedLogs.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedLogs.size} selected
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteDialogOpen(true)}
                      className="rounded-full"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Selected
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="font-medium mb-2">No audit logs found</p>
                  <p className="text-sm">
                    {selectedEntityType === "all"
                      ? "Audit logs will appear here when Admin or Super Admin users perform actions."
                      : `No audit logs found for ${selectedEntityType} entity type.`}
                  </p>
                  <p className="text-xs mt-2 text-muted-foreground">
                    If you just set up the system, make sure to run database migrations.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={logs.length > 0 && selectedLogs.size === logs.length}
                              onCheckedChange={toggleSelectAll}
                            />
                          </TableHead>
                          <TableHead className="min-w-[120px] sm:min-w-[150px]">Date & Time</TableHead>
                          <TableHead className="min-w-[120px] sm:min-w-[150px]">User</TableHead>
                          <TableHead className="min-w-[100px] sm:min-w-[120px]">Action</TableHead>
                          <TableHead className="min-w-[90px] sm:min-w-[110px]">Entity Type</TableHead>
                          <TableHead className="min-w-[100px] sm:min-w-[120px]">Entity ID</TableHead>
                          <TableHead className="min-w-[150px] sm:min-w-[200px]">Details</TableHead>
                          <TableHead className="w-16 sm:w-20">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedLogs.has(log.id)}
                                onCheckedChange={() => toggleLogSelection(log.id)}
                              />
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {formatDate(log.createdAt)}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium truncate">{log.userName || "Unknown"}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {log.userEmail || log.userId}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-xs bg-muted px-2 py-1 rounded whitespace-nowrap">
                                {log.action}
                              </span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{log.entityType}</TableCell>
                            <TableCell>
                              {log.entityId ? (
                                <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                                  {log.entityId.substring(0, 8)}...
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {log.details ? (
                                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-w-[200px] sm:max-w-md">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedLogs(new Set([log.id]));
                                  setDeleteDialogOpen(true);
                                }}
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive"
                                title="Delete log"
                              >
                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Audit Logs</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedLogs.size} audit log(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

