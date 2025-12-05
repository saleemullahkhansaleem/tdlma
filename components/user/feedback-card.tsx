"use client";

import { Feedback } from "@/lib/types/feedback";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface FeedbackCardProps {
  feedback: Feedback;
}

export function FeedbackCard({ feedback }: FeedbackCardProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Resolved":
        return "success";
      case "Reviewed":
        return "default";
      case "Pending":
        return "outline";
      default:
        return "outline";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Complaint":
        return "destructive";
      case "Suggestion":
        return "default";
      default:
        return "soft";
    }
  };

  return (
    <Card className="rounded-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold">{feedback.title}</h3>
            <div className="mt-1 flex flex-wrap gap-2">
              <Badge variant={getTypeColor(feedback.type)}>{feedback.type}</Badge>
              <Badge variant="soft">{feedback.category}</Badge>
              <Badge variant={getStatusVariant(feedback.status)}>
                {feedback.status}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{feedback.description}</p>

        {feedback.response && (
          <div className="rounded-md bg-muted p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Admin Response:
            </p>
            <p className="text-sm">{feedback.response}</p>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Submitted: {format(new Date(feedback.createdAt), "MMM dd, yyyy")}
          </span>
          {feedback.updatedAt !== feedback.createdAt && (
            <span>
              Updated: {format(new Date(feedback.updatedAt), "MMM dd, yyyy")}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
