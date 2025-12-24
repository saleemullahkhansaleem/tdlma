"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useAdminPermissions } from "@/lib/hooks/use-admin-permissions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Plus, Edit, Trash2, Search, Filter, X } from "lucide-react";
import { getGuests, getUsersList, deleteGuest, deleteGuests, createGuest } from "@/lib/api/client";
import { Guest } from "@/lib/types/guest";
import { User } from "@/lib/types/user";
import { MealType } from "@/lib/types/attendance";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function AdminGuestsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [inviterFilter, setInviterFilter] = useState<string>("all");
  const [mealTypeFilter, setMealTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace("/login");
      } else if (user.role !== "admin" && user.role !== "super_admin") {
        router.replace("/user/dashboard");
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!permissionsLoading && user) {
      if (user.role === "admin" && !hasPermission("guests")) {
        router.replace("/admin/dashboard");
      }
    }
  }, [user, hasPermission, permissionsLoading, router]);

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) return;

    loadGuests();
    loadUsers();
  }, [user, startDate, endDate, inviterFilter, mealTypeFilter]);

  const loadUsers = async () => {
    if (!user) return;
    try {
      // Use getUsersList which allows admins to fetch users for guest management
      const data = await getUsersList(user);
      setAllUsers(data);
    } catch (err: any) {
      console.error("Failed to load users:", err);
      // Set empty array on error to prevent UI breaking
      setAllUsers([]);
    }
  };

  const loadGuests = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const filters: any = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (inviterFilter !== "all") filters.inviterId = inviterFilter;
      if (mealTypeFilter !== "all") filters.mealType = mealTypeFilter as MealType;

      const data = await getGuests(user, filters);
      setGuests(data);
    } catch (err: any) {
      setError(err.message || "Failed to load guests");
    } finally {
      setLoading(false);
    }
  };

  const filteredGuests = guests.filter((guest) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const inviter = allUsers.find((u) => u.id === guest.inviterId);
    return (
      guest.name.toLowerCase().includes(query) ||
      guest.date.includes(query) ||
      inviter?.name.toLowerCase().includes(query) ||
      inviter?.email.toLowerCase().includes(query)
    );
  });

  const toggleGuestSelection = (guestId: string) => {
    setSelectedGuests((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(guestId)) {
        newSet.delete(guestId);
      } else {
        newSet.add(guestId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedGuests.size === filteredGuests.length) {
      setSelectedGuests(new Set());
    } else {
      setSelectedGuests(new Set(filteredGuests.map((g) => g.id)));
    }
  };

  const handleDelete = async () => {
    if (!user || selectedGuests.size === 0) return;

    setDeleteLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (selectedGuests.size === 1) {
        await deleteGuest(Array.from(selectedGuests)[0], user);
      } else {
        await deleteGuests(Array.from(selectedGuests), user);
      }

      setSuccess(`Successfully deleted ${selectedGuests.size} guest(s)`);
      setSelectedGuests(new Set());
      setDeleteDialogOpen(false);
      loadGuests();
    } catch (err: any) {
      setError(err.message || "Failed to delete guest(s)");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEdit = (guest: Guest) => {
    setEditingGuest(guest);
    setEditDialogOpen(true);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInviterName = (inviterId: string) => {
    const inviter = allUsers.find((u) => u.id === inviterId);
    return inviter?.name || "Unknown";
  };

  if (authLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Guest Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all guest entries in the system
          </p>
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="rounded-full"
        >
          <Plus className="h-4 w-4" />
          Add Guest
        </Button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-4 flex items-center gap-3">
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label className="pl-4 block">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="pl-4 block">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="pl-4 block">Inviter</Label>
              <Select value={inviterFilter} onValueChange={setInviterFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {allUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="pl-4 block">Meal Type</Label>
              <Select value={mealTypeFilter} onValueChange={setMealTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Breakfast">Breakfast</SelectItem>
                  <SelectItem value="Lunch">Lunch</SelectItem>
                  <SelectItem value="Dinner">Dinner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setInviterFilter("all");
                  setMealTypeFilter("all");
                  setSearchQuery("");
                }}
                className="w-full rounded-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Label className="pl-4 block">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by guest name, date, or inviter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guests Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Guests</CardTitle>
              <CardDescription>
                {filteredGuests.length} guest(s) found
              </CardDescription>
            </div>
            {selectedGuests.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedGuests.size} selected
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
          ) : filteredGuests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="font-medium mb-2">No guests found</p>
              <p className="text-sm">
                {startDate || endDate || inviterFilter !== "all" || mealTypeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No guests have been added yet"}
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
                          checked={
                            filteredGuests.length > 0 &&
                            selectedGuests.size === filteredGuests.length
                          }
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="min-w-[120px] sm:min-w-[150px]">Guest Name</TableHead>
                      <TableHead className="min-w-[100px] sm:min-w-[120px]">Date</TableHead>
                      <TableHead className="min-w-[90px] sm:min-w-[100px]">Meal Type</TableHead>
                      <TableHead className="min-w-[120px] sm:min-w-[150px]">Inviter</TableHead>
                      <TableHead className="text-right min-w-[100px]">Amount</TableHead>
                      <TableHead className="w-20 sm:w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGuests.map((guest) => (
                      <TableRow key={guest.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedGuests.has(guest.id)}
                            onCheckedChange={() => toggleGuestSelection(guest.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium truncate">{guest.name}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(guest.date)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{guest.mealType}</Badge>
                        </TableCell>
                        <TableCell className="truncate">{getInviterName(guest.inviterId)}</TableCell>
                        <TableCell className="text-right font-semibold whitespace-nowrap">
                          Rs {parseFloat(guest.amount.toString()).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(guest)}
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                              title="Edit guest"
                            >
                              <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedGuests(new Set([guest.id]));
                                setDeleteDialogOpen(true);
                              }}
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive"
                              title="Delete guest"
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
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Guest(s)</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedGuests.size} guest(s)? This action cannot be undone.
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

      {/* Add Guest Dialog */}
      <AddGuestDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => {
          setAddDialogOpen(false);
          loadGuests();
        }}
        users={allUsers.filter((u) => u.role === "user")}
      />

      {/* Edit Guest Dialog */}
      {editingGuest && (
        <EditGuestDialog
          guest={editingGuest}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={() => {
            setEditDialogOpen(false);
            setEditingGuest(null);
            loadGuests();
          }}
          users={allUsers}
        />
      )}
    </div>
  );
}

function AddGuestDialog({
  open,
  onOpenChange,
  onSuccess,
  users,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  users: User[];
}) {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    inviterId: "",
    name: "",
    date: new Date().toISOString().split("T")[0], // Today's date
    mealType: "Lunch" as MealType,
  });

  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setFormData({
        inviterId: users.length > 0 ? users[0].id : "",
        name: "",
        date: new Date().toISOString().split("T")[0],
        mealType: "Lunch",
      });
      setError(null);
    }
  }, [open, users]);

  const handleSubmit = async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    // Validation
    if (!formData.inviterId) {
      setError("Please select an inviter");
      setLoading(false);
      return;
    }

    if (!formData.name.trim()) {
      setError("Please enter guest name");
      setLoading(false);
      return;
    }

    if (!formData.date) {
      setError("Please select a date");
      setLoading(false);
      return;
    }

    try {
      await createGuest(
        {
          inviterId: formData.inviterId,
          name: formData.name.trim(),
          date: formData.date,
          mealType: formData.mealType,
        },
        currentUser
      );

      onSuccess();
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to create guest");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Guest</DialogTitle>
          <DialogDescription>Create a new guest entry</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="pl-4 block" htmlFor="inviter">Inviter</Label>
            <Select
              value={formData.inviterId}
              onValueChange={(value) =>
                setFormData({ ...formData, inviterId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select inviter" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="pl-4 block" htmlFor="name">Guest Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter guest name"
            />
          </div>

          <div className="space-y-2">
            <Label className="pl-4 block" htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label className="pl-4 block" htmlFor="mealType">Meal Type</Label>
            <Select
              value={formData.mealType}
              onValueChange={(value) =>
                setFormData({ ...formData, mealType: value as MealType })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Breakfast">Breakfast</SelectItem>
                <SelectItem value="Lunch">Lunch</SelectItem>
                <SelectItem value="Dinner">Dinner</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="rounded-full">
            {loading ? "Creating..." : "Add Guest"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditGuestDialog({
  guest,
  open,
  onOpenChange,
  onSuccess,
  users,
}: {
  guest: Guest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  users: User[];
}) {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    inviterId: guest.inviterId,
    name: guest.name,
    date: guest.date,
    mealType: guest.mealType,
  });

  useEffect(() => {
    if (open) {
      setFormData({
        inviterId: guest.inviterId,
        name: guest.name,
        date: guest.date,
        mealType: guest.mealType,
      });
      setError(null);
    }
  }, [open, guest]);

  const handleSubmit = async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    try {
      const { updateGuest } = await import("@/lib/api/client");
      await updateGuest(
        {
          id: guest.id,
          ...formData,
        },
        currentUser
      );

      onSuccess();
      setSuccess("Guest updated successfully");
    } catch (err: any) {
      setError(err.message || "Failed to update guest");
    } finally {
      setLoading(false);
    }
  };

  const [success, setSuccess] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Guest</DialogTitle>
          <DialogDescription>Update guest information</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/20 p-3 text-sm text-emerald-600 dark:text-emerald-400">
            {success}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="pl-4 block" htmlFor="inviter">Inviter</Label>
            <Select
              value={formData.inviterId}
              onValueChange={(value) =>
                setFormData({ ...formData, inviterId: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="pl-4 block" htmlFor="name">Guest Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label className="pl-4 block" htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label className="pl-4 block" htmlFor="mealType">Meal Type</Label>
            <Select
              value={formData.mealType}
              onValueChange={(value) =>
                setFormData({ ...formData, mealType: value as MealType })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Breakfast">Breakfast</SelectItem>
                <SelectItem value="Lunch">Lunch</SelectItem>
                <SelectItem value="Dinner">Dinner</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="rounded-full">
            {loading ? "Updating..." : "Update Guest"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

