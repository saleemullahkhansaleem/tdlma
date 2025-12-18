"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { User, CreateUserDto, UpdateUserDto } from "@/lib/types/user";
import { createUser, updateUser } from "@/lib/api/client";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

interface UserFormModalProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ROLES: ("user" | "admin" | "super_admin")[] = [
  "user",
  "admin",
  "super_admin",
];

export function UserFormModal({
  user,
  open,
  onOpenChange,
  onSuccess,
}: UserFormModalProps) {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    currentPassword: "",
    role: "user" as "user" | "admin" | "super_admin",
    status: "Active" as "Active" | "Inactive",
    designation: "",
    userType: "employee" as "employee" | "student",
  });

  const isEdit = !!user;

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: "",
        confirmPassword: "",
        currentPassword: "",
        role: user.role,
        status: user.status,
        designation: user.designation || "",
        userType: user.userType || "employee",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        currentPassword: "",
        role: "user",
        status: "Active",
        designation: "",
        userType: "employee",
      });
    }
    setError(null);
  }, [user, open]);

  const handleSubmit = async () => {
    if (!currentUser) return;

    setError(null);

    // Validation
    if (!formData.name || !formData.email) {
      setError("Name and email are required");
      return;
    }

    if (!formData.userType || (formData.userType !== "employee" && formData.userType !== "student")) {
      setError("User type is required");
      return;
    }

    if (!isEdit && !formData.password) {
      setError("Password is required for new users");
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    // Check if passwords match
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // If editing own account and changing password, require current password
    const isUpdatingSelf = isEdit && user.id === currentUser.id;
    if (isUpdatingSelf && formData.password) {
      if (!formData.currentPassword) {
        setError("Current password is required to change your password");
        return;
      }
    }

    setLoading(true);

    try {
      if (isEdit) {
        const updateData: UpdateUserDto = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          status: formData.status,
          designation: formData.designation || undefined,
          userType: formData.userType,
        };
        if (formData.password) {
          updateData.password = formData.password;
          if (isUpdatingSelf) {
            updateData.currentPassword = formData.currentPassword;
          }
        }
        await updateUser(user.id, updateData, currentUser);
      } else {
        const createData: CreateUserDto = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          status: formData.status,
          designation: formData.designation || undefined,
          userType: formData.userType,
        };
        await createUser(createData, currentUser);
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Create User"}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              placeholder="Full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>

          {isEdit && user.id === currentUser?.id && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Password</label>
              <Input
                type="password"
                placeholder="Enter current password (required if changing password)"
                value={formData.currentPassword}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currentPassword: e.target.value,
                  })
                }
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {isEdit ? "New Password (leave empty to keep current)" : "Password"}
            </label>
            <Input
              type="password"
              placeholder={isEdit ? "New password (optional)" : "Password"}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required={!isEdit}
            />
          </div>

          {formData.password && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm Password</label>
              <Input
                type="password"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                required={!!formData.password}
              />
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-sm font-medium">Role <span className="text-destructive">*</span></Label>
            <RadioGroup
              value={formData.role}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  role: value as "user" | "admin" | "super_admin",
                })
              }
              className="flex flex-wrap gap-4"
            >
              {ROLES.map((role) => (
                <div key={role} className="flex items-center space-x-2">
                  <RadioGroupItem value={role} id={`role-${role}`} />
                  <Label
                    htmlFor={`role-${role}`}
                    className={cn(
                      "text-sm font-normal cursor-pointer",
                      formData.role === role && "font-medium"
                    )}
                  >
                    {role === "super_admin" ? "Super Admin" : role.charAt(0).toUpperCase() + role.slice(1)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Status <span className="text-destructive">*</span></Label>
            <RadioGroup
              value={formData.status}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  status: value as "Active" | "Inactive",
                })
              }
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Active" id="status-active" />
                <Label
                  htmlFor="status-active"
                  className={cn(
                    "text-sm font-normal cursor-pointer",
                    formData.status === "Active" && "font-medium"
                  )}
                >
                  Active
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Inactive" id="status-inactive" />
                <Label
                  htmlFor="status-inactive"
                  className={cn(
                    "text-sm font-normal cursor-pointer",
                    formData.status === "Inactive" && "font-medium"
                  )}
                >
                  Inactive
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Designation</label>
            <Input
              placeholder="e.g., Software Engineer, Student"
              value={formData.designation}
              onChange={(e) =>
                setFormData({ ...formData, designation: e.target.value })
              }
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">User Type <span className="text-destructive">*</span></Label>
            <RadioGroup
              value={formData.userType}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  userType: value as "employee" | "student",
                })
              }
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="employee" id="user-type-employee" />
                <Label
                  htmlFor="user-type-employee"
                  className={cn(
                    "text-sm font-normal cursor-pointer",
                    formData.userType === "employee" && "font-medium"
                  )}
                >
                  Employee
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="student" id="user-type-student" />
                <Label
                  htmlFor="user-type-student"
                  className={cn(
                    "text-sm font-normal cursor-pointer",
                    formData.userType === "student" && "font-medium"
                  )}
                >
                  Student
                </Label>
              </div>
            </RadioGroup>
          </div>

        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-full"
          >
            {loading ? "Saving..." : isEdit ? "Update User" : "Create User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
