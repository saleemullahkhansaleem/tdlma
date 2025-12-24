"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { User } from "@/lib/types/user";
import { getAllUsers, deleteUser } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserFormModal } from "./user-form-modal";
import { format } from "date-fns";
import { Plus, Edit, Trash2, Search, UserCog, AlertCircle } from "lucide-react";
import { updateUser } from "@/lib/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const ROLES: ("user" | "admin" | "super_admin" | "all")[] = [
  "all",
  "user",
  "admin",
  "super_admin",
];

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [updatingStatusIds, setUpdatingStatusIds] = useState<Set<string>>(new Set());

  const loadUsers = async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getAllUsers(currentUser);
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentUser]);

  const handleDelete = async () => {
    if (!userToDelete || !currentUser) return;

    const userIdToDelete = userToDelete.id;

    // Optimistically remove user from UI immediately
    setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userIdToDelete));

    setDeleting(true);
    setDeleteModalOpen(false);
    const userToDeleteName = userToDelete.name;
    setUserToDelete(null);

    try {
      // Delete in the background (non-blocking)
      await deleteUser(userIdToDelete, currentUser);
    } catch (err: any) {
      // On error, revert by reloading all users
      setError(err.message || "Failed to delete user");
      await loadUsers();
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setFormModalOpen(true);
  };

  const handleFormSuccess = () => {
    loadUsers();
  };

  // Filter users - memoized for performance
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        !searchQuery ||
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.designation &&
          user.designation.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesUserType =
        userTypeFilter === "all" ||
        !userTypeFilter ||
        user.userType === userTypeFilter;

      return matchesSearch && matchesRole && matchesUserType;
    });
  }, [users, searchQuery, roleFilter, userTypeFilter]);

  // Pagination - memoized for performance
  const totalPages = Math.ceil(filteredUsers.length / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, startIndex, endIndex]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, roleFilter, userTypeFilter]);

  const getRoleVariant = (role: string) => {
    switch (role) {
      case "super_admin":
        return "destructive";
      case "admin":
        return "default";
      default:
        return "soft";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Super Admin";
      case "admin":
        return "Admin";
      default:
        return "User";
    }
  };

  const handleStatusChange = async (user: User, newStatus: "Active" | "Inactive") => {
    if (!currentUser) return;

    const userId = user.id;

    // Optimistically update the UI immediately
    setUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.id === userId ? { ...u, status: newStatus } : u
      )
    );

    // Track updating state
    setUpdatingStatusIds((prev) => new Set(prev).add(userId));

    try {
      // Update in the background (non-blocking)
      await updateUser(userId, { status: newStatus }, currentUser);
    } catch (err: any) {
      // On error, revert the optimistic update and reload
      setError(err.message || "Failed to update user status");
      // Revert to original status
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === userId ? { ...u, status: user.status } : u
        )
      );
      // Optionally reload to ensure consistency
      loadUsers();
    } finally {
      // Remove from updating set
      setUpdatingStatusIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <UserCog className="h-6 w-6 text-primary" />
            User Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage users, admins, and super admins
          </p>
        </div>
        <Button onClick={handleCreate} className="rounded-full w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Create User
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-md border bg-card p-4">
        <div className="flex-1 min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
        </div>

        <div className="w-full sm:w-auto sm:min-w-[150px]">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {role === "all"
                    ? "All Roles"
                    : role === "super_admin"
                      ? "Super Admin"
                      : role.charAt(0).toUpperCase() + role.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-auto sm:min-w-[150px]">
          <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
              <SelectItem value="student">Student</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="text-sm text-muted-foreground">
          Showing {paginatedUsers.length > 0 ? startIndex + 1 : 0}-
          {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length}{" "}
          {filteredUsers.length !== users.length && `(filtered from ${users.length} total)`} users
          {userTypeFilter !== "all" && ` • ${userTypeFilter === "employee" ? "Employees" : "Students"}`}
        </div>
      )}

      {/* Users Table */}
      {filteredUsers.length === 0 && !loading ? (
        <div className="rounded-md border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            {searchQuery || roleFilter !== "all"
              ? "No users match your filters"
              : "No users found"}
          </p>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px] sm:min-w-[200px]">Name</TableHead>
                  <TableHead className="min-w-[180px] sm:min-w-[220px]">Email</TableHead>
                  <TableHead className="min-w-[100px]">Role</TableHead>
                  <TableHead className="min-w-[120px]">Designation</TableHead>
                  <TableHead className="min-w-[100px]">User Type</TableHead>
                  <TableHead className="min-w-[120px]">Status</TableHead>
                  <TableHead className="min-w-[120px]">Created</TableHead>
                  <TableHead className="text-right min-w-[140px] sm:min-w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Skeleton rows
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="min-w-[150px] sm:min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[180px] sm:min-w-[220px]">
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="min-w-[100px]">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="min-w-[100px]">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        <Skeleton className="h-7 w-24" />
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="text-right min-w-[140px] sm:min-w-[160px]">
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  paginatedUsers.map((user) => {
                    const isOwnRecord = user.id === currentUser?.id;
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium min-w-[150px] sm:min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <Avatar
                              alt={user.name}
                              fallback={user.name[0]}
                              className="h-8 w-8 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {user.name}
                                {isOwnRecord && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    (You)
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[180px] sm:min-w-[220px]">
                          <p className="truncate">{user.email}</p>
                        </TableCell>
                        <TableCell className="min-w-[100px]">
                          <Badge variant={getRoleVariant(user.role)}>
                            {getRoleLabel(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell className="min-w-[120px]">
                          <p className="truncate text-sm">
                            {user.designation || "-"}
                          </p>
                        </TableCell>
                        <TableCell className="min-w-[100px]">
                          {user.userType ? (
                            <Badge variant="outline">
                              {user.userType === "employee"
                                ? "Employee"
                                : "Student"}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="min-w-[120px]">
                          <Select
                            value={user.status}
                            onValueChange={(value) =>
                              handleStatusChange(
                                user,
                                value as "Active" | "Inactive"
                              )
                            }
                            disabled={updatingStatusIds.has(user.id)}
                          >
                            <SelectTrigger className="w-full sm:w-32 h-7">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground min-w-[120px]">
                          {format(new Date(user.createdAt), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="text-right min-w-[140px] sm:min-w-[160px]">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(user)}
                              className="rounded-full"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setUserToDelete(user);
                                setDeleteModalOpen(true);
                              }}
                              disabled={isOwnRecord}
                              className="rounded-full text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-full"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-full"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <UserFormModal
        user={selectedUser}
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {userToDelete?.name}
              </span>
              ? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setUserToDelete(null);
              }}
              className="rounded-full"
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-full"
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
