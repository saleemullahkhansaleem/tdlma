"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { OffDay, CreateOffDayDto, UpdateOffDayDto } from "@/lib/types/off-days";
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
import { Plus, Edit, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";

export function OffDaysManager() {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getOffDays(currentUser);
      setOffDays(data);
    } catch (err: any) {
      setError(err.message || "Failed to load off days");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffDays();
  }, [currentUser]);

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
    if (!offDayToDelete || !currentUser) return;

    setDeleting(true);
    try {
      await deleteOffDay(offDayToDelete.id, currentUser);
      await loadOffDays();
      setDeleteModalOpen(false);
      setOffDayToDelete(null);
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
    if (!currentUser) return;

    // Validate reason (1-3 words)
    if (!validateReason(formData.reason)) {
      setError("Reason must be 1 to 3 words only");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (selectedOffDay) {
        // Update existing
        await updateOffDay(selectedOffDay.id, formData, currentUser);
      } else {
        // Create new
        await createOffDay(formData, currentUser);
      }
      await loadOffDays();
      setFormModalOpen(false);
      setSelectedOffDay(null);
      setFormData({ date: "", reason: "" });
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
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          <div className="h-9 w-24 bg-muted animate-pulse rounded-full" />
        </div>
        <div className="border rounded-lg">
          <div className="h-12 bg-muted/50" />
          <div className="h-16 bg-muted/30" />
          <div className="h-16 bg-muted/30" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">Off Days</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage dates when meals are not available with clarification text
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="rounded-full"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Off Day
        </Button>
      </div>

      {offDays.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No off days configured. Add dates when meals are not available.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offDays.map((offDay) => (
                <TableRow key={offDay.id}>
                  <TableCell className="font-medium text-xs md:text-sm">
                    {formatDate(offDay.date)}
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                      {offDay.reason}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(offDay)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(offDay)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
                <label className="text-sm font-medium">Date</label>
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
                <label className="text-sm font-medium">Reason</label>
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
