"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Search, Filter } from "lucide-react";

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
        
        // Show message if table doesn't exist
        if (data.message) {
          console.warn(data.message);
        }
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

      <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Action</label>
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
              <CardTitle>Audit Logs</CardTitle>
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity Type</TableHead>
                        <TableHead>Entity ID</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {formatDate(log.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{log.userName || "Unknown"}</div>
                              <div className="text-xs text-muted-foreground">
                                {log.userEmail || log.userId}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                              {log.action}
                            </span>
                          </TableCell>
                          <TableCell>{log.entityType}</TableCell>
                          <TableCell>
                            {log.entityId ? (
                              <span className="font-mono text-xs text-muted-foreground">
                                {log.entityId.substring(0, 8)}...
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {log.details ? (
                              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-w-md">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
      </div>
    </div>
  );
}

