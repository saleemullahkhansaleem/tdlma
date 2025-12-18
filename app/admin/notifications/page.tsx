"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Send, Users, UserCheck, Briefcase, GraduationCap, Shield } from "lucide-react";
import { getAllUsers } from "@/lib/api/client";
import { User } from "@/lib/types/user";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function NotificationManagementPage() {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    recipientType: "all_users" as "all_users" | "specific_users" | "students" | "employees" | "admins",
    userIds: [] as string[],
    sendEmail: true,
  });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (currentUser && formData.recipientType === "specific_users") {
      loadUsers();
    }
  }, [currentUser, formData.recipientType]);

  const loadUsers = async () => {
    if (!currentUser) return;
    try {
      const allUsers = await getAllUsers(currentUser);
      const regularUsers = allUsers.filter((u) => u.role === "user" && u.status === "Active");
      setUsers(regularUsers);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    }
  };

  const getRecipientCount = (): number => {
    switch (formData.recipientType) {
      case "all_users":
        return users.filter((u) => u.role === "user" && u.status === "Active").length;
      case "specific_users":
        return formData.userIds.length;
      case "students":
        return users.filter((u) => u.role === "user" && u.status === "Active" && u.userType === "student").length;
      case "employees":
        return users.filter((u) => u.role === "user" && u.status === "Active" && u.userType === "employee").length;
      case "admins":
        return users.filter((u) => (u.role === "admin" || u.role === "super_admin") && u.status === "Active").length;
      default:
        return 0;
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) return;

    setError(null);
    setSuccess(null);

    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    if (!formData.message.trim()) {
      setError("Message is required");
      return;
    }

    if (formData.recipientType === "specific_users" && formData.userIds.length === 0) {
      setError("Please select at least one user");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
          "x-user-email": currentUser.email,
          "x-user-name": currentUser.name,
          "x-user-role": currentUser.role,
        },
        body: JSON.stringify({
          title: formData.title,
          message: formData.message,
          recipientType: formData.recipientType,
          userIds: formData.recipientType === "specific_users" ? formData.userIds : undefined,
          sendEmail: formData.sendEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send notifications");
      }

      setSuccess(`Notifications sent successfully to ${data.count} recipient(s)`);
      setFormData({
        title: "",
        message: "",
        recipientType: "all_users",
        userIds: [],
        sendEmail: true,
      });
    } catch (err: any) {
      setError(err.message || "Failed to send notifications");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUserSelection = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      userIds: prev.userIds.includes(userId)
        ? prev.userIds.filter((id) => id !== userId)
        : [...prev.userIds, userId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Send Notifications
          </h2>
          <p className="text-sm text-muted-foreground">
            Send notifications to users, students, employees, or admins
          </p>
        </div>
      </div>

      {/* Notification Form */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600">
              {success}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Notification title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              {formData.title.length}/100 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium">
              Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Notification message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={5}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {formData.message.length}/500 characters
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Recipients <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={formData.recipientType}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  recipientType: value as typeof formData.recipientType,
                  userIds: [],
                })
              }
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all_users" id="all-users" />
                <Label
                  htmlFor="all-users"
                  className={cn(
                    "text-sm font-normal cursor-pointer flex items-center gap-2",
                    formData.recipientType === "all_users" && "font-medium"
                  )}
                >
                  <Users className="h-4 w-4" />
                  All Users
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="students" id="students" />
                <Label
                  htmlFor="students"
                  className={cn(
                    "text-sm font-normal cursor-pointer flex items-center gap-2",
                    formData.recipientType === "students" && "font-medium"
                  )}
                >
                  <GraduationCap className="h-4 w-4" />
                  All Students
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="employees" id="employees" />
                <Label
                  htmlFor="employees"
                  className={cn(
                    "text-sm font-normal cursor-pointer flex items-center gap-2",
                    formData.recipientType === "employees" && "font-medium"
                  )}
                >
                  <Briefcase className="h-4 w-4" />
                  All Employees
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admins" id="admins" />
                <Label
                  htmlFor="admins"
                  className={cn(
                    "text-sm font-normal cursor-pointer flex items-center gap-2",
                    formData.recipientType === "admins" && "font-medium"
                  )}
                >
                  <Shield className="h-4 w-4" />
                  All Admins
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="specific_users" id="specific-users" />
                <Label
                  htmlFor="specific-users"
                  className={cn(
                    "text-sm font-normal cursor-pointer flex items-center gap-2",
                    formData.recipientType === "specific_users" && "font-medium"
                  )}
                >
                  <UserCheck className="h-4 w-4" />
                  Specific Users
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              Recipients: <span className="font-medium">{getRecipientCount()}</span>
            </p>
          </div>

          {formData.recipientType === "specific_users" && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Users</Label>
              <div className="mb-2">
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="border rounded-md p-4 max-h-64 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No users found
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center space-x-2 p-2 hover:bg-muted rounded"
                      >
                        <Checkbox
                          checked={formData.userIds.includes(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                        />
                        <Label className="text-sm font-normal cursor-pointer flex-1">
                          {user.name} ({user.email})
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="send-email"
              checked={formData.sendEmail}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, sendEmail: checked === true })
              }
            />
            <Label htmlFor="send-email" className="text-sm font-normal cursor-pointer">
              Send email notification
            </Label>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.title.trim() || !formData.message.trim()}
            className="w-full"
          >
            {loading ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Notifications
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
