"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Users,
  UserCheck,
  Briefcase,
  GraduationCap,
  Shield,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Clock,
  Info,
  X,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getAllUsers } from "@/lib/api/client";
import { User } from "@/lib/types/user";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface MessageTemplate {
  id: string;
  title: string;
  message: string;
  icon: React.ReactNode;
}

const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: "clear_dues",
    title: "Clear Your Dues",
    message: "Dear Member,\n\nThis is a reminder to clear your pending dues. Please make the payment at your earliest convenience to avoid any inconvenience.\n\nThank you for your cooperation.",
    icon: <DollarSign className="h-4 w-4" />,
  },
  {
    id: "payment_reminder",
    title: "Payment Reminder",
    message: "Dear Member,\n\nThis is a friendly reminder that your payment is due. Please complete the payment to continue enjoying our services.\n\nThank you.",
    icon: <Clock className="h-4 w-4" />,
  },
  {
    id: "menu_update",
    title: "Menu Update",
    message: "Dear Members,\n\nWe have updated the menu for this week. Please check the new menu items and plan your meals accordingly.\n\nThank you.",
    icon: <Info className="h-4 w-4" />,
  },
  {
    id: "system_maintenance",
    title: "System Maintenance",
    message: "Dear Members,\n\nWe will be performing system maintenance on [DATE]. The system may be temporarily unavailable during this time. We apologize for any inconvenience.\n\nThank you for your understanding.",
    icon: <Info className="h-4 w-4" />,
  },
];

export default function SendNotificationsPage() {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    recipientType: "all_users" as "all_users" | "specific_users" | "students" | "employees" | "admins",
    userIds: [] as string[],
    sendEmail: true,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [userSelectExpanded, setUserSelectExpanded] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadAllUsers();
    }
  }, [currentUser]);

  const loadAllUsers = async () => {
    if (!currentUser) return;
    setLoadingUsers(true);
    try {
      const data = await getAllUsers(currentUser);
      setAllUsers(data);
      // Filter active users for specific selection
      const activeUsers = data.filter((u) => u.role === "user" && u.status === "Active");
      setUsers(activeUsers);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const getRecipientCount = (): number => {
    switch (formData.recipientType) {
      case "all_users":
        return allUsers.filter((u) => u.role === "user" && u.status === "Active").length;
      case "specific_users":
        return formData.userIds.length;
      case "students":
        return allUsers.filter((u) => u.role === "user" && u.status === "Active" && u.userType === "student").length;
      case "employees":
        return allUsers.filter((u) => u.role === "user" && u.status === "Active" && u.userType === "employee").length;
      case "admins":
        return allUsers.filter((u) => (u.role === "admin" || u.role === "super_admin") && u.status === "Active").length;
      default:
        return 0;
    }
  };

  const handleTemplateSelect = (template: MessageTemplate) => {
    setFormData({
      ...formData,
      title: template.title,
      message: template.message,
    });
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
      setSearchQuery("");
      setUserSelectExpanded(false);
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

  const removeUser = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      userIds: prev.userIds.filter((id) => id !== userId),
    }));
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredUsers.map((u) => u.id);
    setFormData((prev) => ({
      ...prev,
      userIds: [...new Set([...prev.userIds, ...filteredIds])],
    }));
  };

  const deselectAllFiltered = () => {
    const filteredIds = filteredUsers.map((u) => u.id);
    setFormData((prev) => ({
      ...prev,
      userIds: prev.userIds.filter((id) => !filteredIds.includes(id)),
    }));
  };

  const selectedUsers = users.filter((u) => formData.userIds.includes(u.id));
  const allFilteredSelected = filteredUsers.length > 0 && filteredUsers.every((u) => formData.userIds.includes(u.id));

  const recipientTypes = [
    {
      id: "all_users",
      label: "All Users",
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: "students",
      label: "All Students",
      icon: <GraduationCap className="h-4 w-4" />,
    },
    {
      id: "employees",
      label: "All Employees",
      icon: <Briefcase className="h-4 w-4" />,
    },
    {
      id: "admins",
      label: "All Admins",
      icon: <Shield className="h-4 w-4" />,
    },
    {
      id: "specific_users",
      label: "Specific Users",
      icon: <UserCheck className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Send className="h-6 w-6 text-primary" />
            Send Notifications
          </h2>
          <p className="text-sm text-muted-foreground">
            Send notifications to users, students, employees, or admins with predefined templates
          </p>
        </div>
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

      {/* Notification Form */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Form</CardTitle>
          <CardDescription>
            Fill in the details and select recipients for your notification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Quick Templates</Label>
            <div className="flex flex-wrap gap-2">
              {MESSAGE_TEMPLATES.map((template) => (
                <Button
                  key={template.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => handleTemplateSelect(template)}
                >
                  {template.icon}
                  {template.title}
                </Button>
              ))}
            </div>
          </div>

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
              rows={6}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {formData.message.length}/500 characters
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Recipients <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {recipientTypes.map((type) => (
                <Button
                  key={type.id}
                  type="button"
                  variant={formData.recipientType === type.id ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "rounded-full",
                    formData.recipientType === type.id && "shadow-sm"
                  )}
                  onClick={() => {
                    setFormData({
                      ...formData,
                      recipientType: type.id as typeof formData.recipientType,
                      userIds: type.id === "specific_users" ? formData.userIds : [],
                    });
                    if (type.id === "specific_users") {
                      setUserSelectExpanded(true);
                    }
                  }}
                >
                  {type.icon}
                  {type.label}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Recipients:</span>
              <Badge variant="outline" className="font-semibold">
                {getRecipientCount()}
              </Badge>
            </div>
          </div>

          {formData.recipientType === "specific_users" && (
            <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Select Users</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setUserSelectExpanded(!userSelectExpanded)}
                  className="h-7"
                >
                  {userSelectExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Hide
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Show
                    </>
                  )}
                </Button>
              </div>

              {/* Selected Users Display */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-background">
                  {selectedUsers.map((user) => (
                    <Badge
                      key={user.id}
                      variant="default"
                      className="flex items-center gap-1.5 pr-1"
                    >
                      <span className="text-xs">{user.name}</span>
                      <button
                        type="button"
                        onClick={() => removeUser(user.id)}
                        className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* User Selection List */}
              {userSelectExpanded && (
                <div className="space-y-3 border rounded-lg p-4 bg-background">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search users by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {filteredUsers.length > 0 && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b">
                      <span>{filteredUsers.length} user(s) found</span>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={selectAllFiltered}
                          disabled={allFilteredSelected}
                        >
                          Select All
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={deselectAllFiltered}
                          disabled={!allFilteredSelected}
                        >
                          Deselect All
                        </Button>
                      </div>
                    </div>
                  )}

                  {loadingUsers ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Loading users...
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {searchQuery ? "No users found matching your search" : "No users available"}
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center space-x-3 p-2 hover:bg-muted rounded-md transition-colors"
                        >
                          <Checkbox
                            id={`user-${user.id}`}
                            checked={formData.userIds.includes(user.id)}
                            onCheckedChange={() => toggleUserSelection(user.id)}
                          />
                          <Label
                            htmlFor={`user-${user.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div>
                              <p className="text-sm font-medium">{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center space-x-2 p-3 border rounded-lg bg-muted/30">
            <Checkbox
              id="send-email"
              checked={formData.sendEmail}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, sendEmail: checked === true })
              }
            />
            <Label htmlFor="send-email" className="text-sm font-normal cursor-pointer flex-1">
              Send email notification
            </Label>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.title.trim() || !formData.message.trim()}
            className="w-full rounded-full"
            size="lg"
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
