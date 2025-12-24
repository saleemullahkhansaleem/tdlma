"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FeedbackWithUser, FeedbackStatus } from "@/lib/types/feedback";
import { updateFeedback } from "@/lib/api/client";
import { useAuth } from "@/lib/auth-context";
import {
  User,
  Mail,
  Calendar,
  Clock,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Save,
  X,
  UtensilsCrossed,
  Timer,
  Users,
  CheckSquare,
  Smartphone,
  Menu as MenuIcon,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";
import { Label } from "../ui/label";

interface FeedbackResponseModalProps {
  feedback: FeedbackWithUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const STATUSES: FeedbackStatus[] = ["Pending", "Reviewed", "Resolved"];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Food: <UtensilsCrossed className="h-4 w-4" />,
  "Meal Timing": <Timer className="h-4 w-4" />,
  Service: <Users className="h-4 w-4" />,
  Attendance: <CheckSquare className="h-4 w-4" />,
  App: <Smartphone className="h-4 w-4" />,
  Menu: <MenuIcon className="h-4 w-4" />,
  Environment: <AlertTriangle className="h-4 w-4" />,
  Suggestion: <Lightbulb className="h-4 w-4" />,
  Other: <MessageSquare className="h-4 w-4" />,
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  Suggestion: <Lightbulb className="h-4 w-4" />,
  Complaint: <AlertCircle className="h-4 w-4" />,
  Feedback: <MessageSquare className="h-4 w-4" />,
};

const STATUS_CONFIG: Record<
  FeedbackStatus,
  { icon: React.ReactNode; variant: "default" | "success" | "outline" | "destructive" | "soft"; color: string }
> = {
  Pending: {
    icon: <Clock className="h-4 w-4" />,
    variant: "outline",
    color: "text-yellow-600 dark:text-yellow-400",
  },
  Reviewed: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    variant: "soft",
    color: "text-blue-600 dark:text-blue-400",
  },
  Resolved: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    variant: "default",
    color: "text-green-600 dark:text-green-400",
  },
};

export function FeedbackResponseModal({
  feedback,
  open,
  onOpenChange,
  onUpdate,
}: FeedbackResponseModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<FeedbackStatus>(
    feedback?.status || "Pending"
  );
  const [response, setResponse] = useState(feedback?.response || "");

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (feedback) {
      setStatus(feedback.status || "Pending");
      setResponse(feedback.response || "");
      setError(null);
    }
  }, [feedback, open]);

  const handleSubmit = async () => {
    if (!feedback || !user) return;

    setLoading(true);
    setError(null);
    try {
      await updateFeedback(
        feedback.id,
        {
          status,
          response: response.trim() || null,
        },
        user
      );
      onUpdate();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Failed to update feedback:", err);
      setError(err.message || "Failed to update feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onOpenChange(false);
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!loading) {
        handleSubmit();
      }
    }
  };

  if (!feedback) return null;

  const statusConfig = STATUS_CONFIG[status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Feedback Details & Response
          </DialogTitle>
          <DialogDescription>
            Review and respond to user feedback
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">{error}</p>
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

        <div className="space-y-6 mt-4">
          {/* User Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                User Information
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-lg">{feedback.user.name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  {feedback.user.email}
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Timestamps
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">{formatDate(feedback.createdAt)}</span>
                </div>
                {feedback.updatedAt && feedback.updatedAt !== feedback.createdAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Updated:</span>
                    <span className="font-medium">{formatDate(feedback.updatedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t" />

          {/* Feedback Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{feedback.title}</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  {CATEGORY_ICONS[feedback.category] || CATEGORY_ICONS.Other}
                  Category
                </div>
                <Badge variant="outline" className="text-sm">
                  {feedback.category}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  {TYPE_ICONS[feedback.type] || TYPE_ICONS.Feedback}
                  Type
                </div>
                <Badge variant="soft" className="text-sm">
                  {feedback.type}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                Description
              </div>
              <div className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">
                {feedback.description}
              </div>
            </div>
          </div>

          <div className="border-t" />

          {/* Admin Response Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Admin Response</h3>
              <div className="space-y-2">
                <Label className="pl-4 block">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as FeedbackStatus)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => {
                      const config = STATUS_CONFIG[s];
                      return (
                        <SelectItem key={s} value={s}>
                          <div className="flex items-center gap-2">
                            <span className={config.color}>{config.icon}</span>
                            {s}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="pl-4 block">Response Message</Label>
              <Textarea
                placeholder="Enter your response to the user..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Press Ctrl/Cmd + Enter to save
              </p>
            </div>

            {feedback.response && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  Previous Response
                </div>
                <div className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm">
                  {feedback.response}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="rounded-full"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-full"
          >
            {loading ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Response
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
