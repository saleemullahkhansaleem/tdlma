"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

interface FeedbackResponseModalProps {
  feedback: FeedbackWithUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const STATUSES: FeedbackStatus[] = ["Pending", "Reviewed", "Resolved"];

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

  if (!feedback) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Feedback Details & Response</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">User</p>
            <p className="font-medium">{feedback.user.name}</p>
            <p className="text-sm text-muted-foreground">{feedback.user.email}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Title</p>
            <p className="font-medium">{feedback.title}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Category</p>
            <p>{feedback.category}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Type</p>
            <p>{feedback.type}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Description</p>
            <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">
              {feedback.description}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={status} onValueChange={(value) => setStatus(value as FeedbackStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Admin Response</label>
            <Textarea
              placeholder="Enter your response to the user..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-full"
          >
            {loading ? "Saving..." : "Save Response"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
