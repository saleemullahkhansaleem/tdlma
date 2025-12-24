"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useAdminPermissions } from "@/lib/hooks/use-admin-permissions";
import { OffDay, CreateOffDayDto } from "@/lib/types/off-days";
import {
  getOffDays,
  createOffDay,
  updateOffDay,
  deleteOffDay,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar, AlertCircle, CheckCircle2, Plus, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

export default function OffDaysPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!permissionsLoading && user) {
      if (user.role === "admin" && !hasPermission("off_days")) {
        router.replace("/admin/dashboard");
      }
    }
  }, [user, hasPermission, permissionsLoading, router]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [offDays, setOffDays] = useState<OffDay[]>([]);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [offDayToDelete, setOffDayToDelete] = useState<OffDay | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedOffDay, setSelectedOffDay] = useState<OffDay | null>(null);
  const [formData, setFormData] = useState<CreateOffDayDto>({
    date: "",
    reason: "",
  });

  const loadOffDays = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getOffDays(user);
      setOffDays(data);
    } catch (err: any) {
      setError(err.message || "Failed to load off days");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffDays();
  }, [user]);

  const handleCreate = () => {
    setSelectedOffDay(null);
    setFormData({ date: "", reason: "" });
    setFormModalOpen(true);
  };

  const handleEdit = (offDay: OffDay) => {
    setSelectedOffDay(offDay);
    setFormData({
      date: offDay.date,
      reason: offDay.reason,
    });
    setFormModalOpen(true);
  };

  const handleDelete = (offDay: OffDay) => {
    setOffDayToDelete(offDay);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!offDayToDelete || !user) return;

    setDeleting(true);
    try {
      await deleteOffDay(offDayToDelete.id, user);
      await loadOffDays();
      setDeleteModalOpen(false);
      setOffDayToDelete(null);
      setSuccess("Off day deleted successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to delete off day");
    } finally {
      setDeleting(false);
    }
  };

  const validateReason = (reason: string): boolean => {
    const words = reason.trim().split(/\s+/).filter((word) => word.length > 0);
    return words.length >= 1 && words.length <= 3;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate reason (1-3 words)
    if (!validateReason(formData.reason)) {
      setError("Reason must be 1 to 3 words only");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (selectedOffDay) {
        // Update existing
        await updateOffDay(selectedOffDay.id, formData, user);
        setSuccess("Off day updated successfully");
      } else {
        // Create new
        await createOffDay(formData, user);
        setSuccess("Off day created successfully");
      }
      await loadOffDays();
      setFormModalOpen(false);
      setSelectedOffDay(null);
      setFormData({ date: "", reason: "" });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save off day");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest("form");
      if (form) {
        form.requestSubmit();
      }
    }
  };

  // Get tomorrow's date in YYYY-MM-DD format
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "EEE, MMM d, yyyy");
    } catch {
      return dateString;
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Off Days Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage holidays and off days when meals are not available. These dates will be excluded from attendance calculations.
          </p>
          {offDays.length > 0 && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
              <span>
                Total: <span className="font-semibold text-foreground">{offDays.length}</span> off day{offDays.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
        <Button
          onClick={handleCreate}
          className="rounded-full w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Add Off Day
        </Button>
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

      {/* Off Days Table */}
      {offDays.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No off days configured. Add dates when meals are not available.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[140px] sm:min-w-[160px]">Date</TableHead>
                  <TableHead className="min-w-[150px]">Reason</TableHead>
                  <TableHead className="text-right min-w-[100px] sm:min-w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offDays.map((offDay) => (
                  <TableRow key={offDay.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {formatDate(offDay.date)}
                    </TableCell>
                    <TableCell>
                      <p className="text-muted-foreground line-clamp-2 max-w-md">
                        {offDay.reason}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(offDay)}
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                          title="Edit off day"
                        >
                          <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(offDay)}
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive"
                          title="Delete off day"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={formModalOpen} onOpenChange={setFormModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedOffDay ? "Edit Off Day" : "Add Off Day"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="pl-4 block">Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  min={getTomorrowDate()}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Select a future date when meals will not be available
                </p>
              </div>
              <div className="space-y-2">
                <Label className="pl-4 block">Reason</Label>
                <Input
                  type="text"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  onKeyDown={handleKeyDown}
                  placeholder="e.g., Public Holiday, Maintenance Day, Office Closed"
                  required
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">
                  Enter 1 to 3 words only (e.g., "Public Holiday", "Maintenance")
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormModalOpen(false);
                  setSelectedOffDay(null);
                  setFormData({ date: "", reason: "" });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? "Saving..."
                  : selectedOffDay
                    ? "Update Off Day"
                    : "Add Off Day"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Off Day</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete the off day for{" "}
              <span className="font-medium">
                {offDayToDelete ? formatDate(offDayToDelete.date) : ""}
              </span>
              ? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setOffDayToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
