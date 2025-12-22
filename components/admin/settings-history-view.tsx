"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { getSettingsHistory, SettingsHistoryEntry } from "@/lib/api/client";
import { History, CheckCircle2, XCircle } from "lucide-react";

export function SettingsHistoryView() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SettingsHistoryEntry[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("all");
  const [availableKeys, setAvailableKeys] = useState<string[]>([]);

  useEffect(() => {
    loadHistory();
  }, [user, selectedKey]);

  const loadHistory = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getSettingsHistory(
        user,
        selectedKey === "all" ? undefined : selectedKey
      );
      setHistory(data);

      // Extract unique setting keys for filter
      const keys = Array.from(new Set(data.map((entry) => entry.settingKey)));
      setAvailableKeys(keys);
    } catch (err: any) {
      setError(err.message || "Failed to load settings history");
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (entry: SettingsHistoryEntry): string => {
    const unit = entry.unit ? ` ${entry.unit}` : "";
    if (entry.valueType === "time") {
      return entry.value;
    } else if (entry.valueType === "number") {
      return `${unit} ${parseFloat(entry.value || "0").toFixed(2)}`;
    } else if (entry.valueType === "boolean") {
      return entry.value === "true" ? "Enabled" : "Disabled";
    }
    return entry.value;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Settings History
            </CardTitle>
            <CardDescription>
              View historical changes to system settings. History is read-only.
            </CardDescription>
          </div>
          <Select value={selectedKey} onValueChange={setSelectedKey}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by setting" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Settings</SelectItem>
              {availableKeys.map((key) => {
                const entry = history.find((e) => e.settingKey === key);
                return (
                  <SelectItem key={key} value={key}>
                    {entry?.description || key}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">{error}</div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No settings history found
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Setting</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Effective From</TableHead>
                  <TableHead>Effective To</TableHead>
                  <TableHead>Changed By</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className={entry.isActive ? "bg-muted/50" : ""}
                  >
                    <TableCell className="font-medium">
                      {entry.description}
                    </TableCell>
                    <TableCell>{formatValue(entry)}</TableCell>
                    <TableCell>{formatDate(entry.effectiveFrom)}</TableCell>
                    <TableCell>
                      {entry.effectiveTo ? formatDate(entry.effectiveTo) : "—"}
                    </TableCell>
                    <TableCell>
                      {entry.creatorName || entry.creatorEmail || "Unknown"}
                    </TableCell>
                    <TableCell>
                      {entry.isActive ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </Badge>
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
  );
}
