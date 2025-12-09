"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getProfile, updateProfile, changePassword } from "@/lib/api/client";
import { User } from "@/lib/types/user";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User as UserIcon,
  Mail,
  Briefcase,
  Users,
  Save,
  Lock,
  AlertCircle,
  CheckCircle2,
  Shield,
  Edit2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminProfilePage() {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    designation: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    loadProfile();
  }, [currentUser]);

  const loadProfile = async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await getProfile(currentUser);
      setProfile(data);
      setFormData({
        name: data.name,
        email: data.email,
        designation: data.designation || "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateProfile(
        {
          name: formData.name,
          email: formData.email,
          designation: formData.designation || undefined,
        },
        currentUser
      );
      setProfile(updated);
      setEditMode(false);
      setSuccess("Profile updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentUser) return;

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setError("All password fields are required");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setChangingPassword(true);
    setError(null);
    setSuccess(null);

    try {
      await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
        currentUser
      );
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordDialogOpen(false);
      setSuccess("Password changed successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
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

  const getRoleVariant = (role: string): "default" | "destructive" | "outline" | "success" | "soft" => {
    switch (role) {
      case "super_admin":
        return "destructive";
      case "admin":
        return "default";
      default:
        return "soft";
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-6 px-4 sm:px-6 lg:px-8">
      {/* Header - Always visible */}
      <div className="mb-6 space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile information and account settings
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Error</p>
            <p className="mt-1">{error}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => setError(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-6 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-600 dark:text-green-400 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Success</p>
            <p className="mt-1">{success}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => setSuccess(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          {/* Profile Card Skeleton */}
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-9 w-20 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Security Card Skeleton */}
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="pb-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-48 rounded-full" />
            </CardContent>
          </Card>
        </div>
      ) : !profile ? (
        <Card className="rounded-2xl border border-destructive/20 bg-destructive/10">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-sm font-medium text-destructive">
              {error || "Profile not found"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Profile Information Card */}
          <Card className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">Profile Information</CardTitle>
                  <CardDescription className="mt-1">
                    Update your personal information and details
                  </CardDescription>
                </div>
                {!editMode ? (
                  <Button
                    variant="outline"
                    onClick={() => setEditMode(true)}
                    className="rounded-full w-full sm:w-auto"
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditMode(false);
                        setFormData({
                          name: profile.name,
                          email: profile.email,
                          designation: profile.designation || "",
                        });
                        setError(null);
                      }}
                      className="rounded-full flex-1 sm:flex-none"
                      disabled={saving}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="rounded-full flex-1 sm:flex-none"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar and Basic Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b">
                <Avatar
                  alt={profile.name}
                  fallback={profile.name[0]}
                  className="h-24 w-24 text-2xl border-2 border-primary/20"
                />
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="text-xl font-semibold">{profile.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {profile.email}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={getRoleVariant(profile.role)}>
                      <Shield className="mr-1.5 h-3 w-3" />
                      {getRoleLabel(profile.role)}
                    </Badge>
                    {profile.userType && (
                      <Badge variant="outline">
                        <Users className="mr-1.5 h-3 w-3" />
                        {profile.userType === "employee"
                          ? "Employee"
                          : "Student"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    Name
                  </label>
                  {editMode ? (
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Full name"
                      className="rounded-full"
                    />
                  ) : (
                    <div className="text-sm text-foreground px-4 py-2 bg-muted/50 rounded-full border">
                      {profile.name}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Email
                  </label>
                  {editMode ? (
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="email@example.com"
                      className="rounded-full"
                    />
                  ) : (
                    <div className="text-sm text-foreground px-4 py-2 bg-muted/50 rounded-full border">
                      {profile.email}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    Role
                  </label>
                  <div className="text-sm text-foreground px-4 py-2 bg-muted/50 rounded-full border">
                    {getRoleLabel(profile.role)}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    Designation
                  </label>
                  {editMode ? (
                    <Input
                      value={formData.designation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          designation: e.target.value,
                        })
                      }
                      placeholder="e.g., Software Engineer"
                      className="rounded-full"
                    />
                  ) : (
                    <div className="text-sm text-foreground px-4 py-2 bg-muted/50 rounded-full border">
                      {profile.designation || (
                        <span className="text-muted-foreground italic">
                          Not set
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    User Type
                  </label>
                  <div className="text-sm text-foreground px-4 py-2 bg-muted/50 rounded-full border">
                    {profile.userType ? (
                      profile.userType === "employee" ? (
                        "Employee"
                      ) : (
                        "Student"
                      )
                    ) : (
                      <span className="text-muted-foreground italic">
                        Not set
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Security
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Manage your password and account security
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setPasswordDialogOpen(true)}
                  className="rounded-full w-full sm:w-auto"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-muted bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">
                  For security reasons, we don't display your password. Use the
                  button above to change it.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one. Make sure it's
              at least 6 characters long.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Password</label>
              <Input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
                placeholder="Enter current password"
                className="rounded-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <Input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                placeholder="Enter new password"
                className="rounded-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Confirm New Password
              </label>
              <Input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                placeholder="Confirm new password"
                className="rounded-full"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPasswordDialogOpen(false);
                setPasswordData({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: "",
                });
                setError(null);
              }}
              className="rounded-full"
              disabled={changingPassword}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="rounded-full"
            >
              <Lock className="mr-2 h-4 w-4" />
              {changingPassword ? "Changing..." : "Change Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
