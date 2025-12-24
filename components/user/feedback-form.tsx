"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createFeedback } from "@/lib/api/client";
import { FeedbackCategory, FeedbackType } from "@/lib/types/feedback";
import { useRouter } from "next/navigation";
import { Label } from "../ui/label";

const CATEGORIES: FeedbackCategory[] = [
  "Food",
  "Meal Timing",
  "Service",
  "Attendance",
  "App",
  "Menu",
  "Environment",
  "Suggestion",
  "Other",
];

const TYPES: FeedbackType[] = ["Suggestion", "Complaint", "Feedback"];

export function FeedbackForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    category: "" as FeedbackCategory | "",
    type: "" as FeedbackType | "",
    title: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to submit feedback");
      return;
    }

    if (!formData.category || !formData.type || !formData.title || !formData.description) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createFeedback(
        {
          category: formData.category,
          type: formData.type,
          title: formData.title,
          description: formData.description,
        },
        user
      );

      setSuccess(true);
      setFormData({
        category: "" as FeedbackCategory | "",
        type: "" as FeedbackType | "",
        title: "",
        description: "",
      });

      // Redirect to my feedback page after 2 seconds
      setTimeout(() => {
        router.push("/user/my-feedback");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="rounded-md">
        <CardContent className="p-8 text-center">
          <div className="mb-4 text-4xl">✅</div>
          <h3 className="mb-2 text-lg font-semibold">Feedback Submitted Successfully!</h3>
          <p className="text-sm text-muted-foreground">
            Redirecting to your feedback page...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle>Submit Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label className="pl-4 block">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value as FeedbackCategory })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="pl-4 block">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value as FeedbackType })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="pl-4 block">Title</Label>
            <Input
              placeholder="Brief title for your feedback"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="pl-4 block">Description</Label>
            <Textarea
              placeholder="Please provide detailed feedback, suggestions, or complaints..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={6}
              required
            />
          </div>

          <div className="flex flex-col md:flex-row gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="rounded-full px-6"
            >
              {loading ? "Submitting..." : "Submit Feedback"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/user/my-feedback")}
              className="rounded-full px-6"
            >
              View My Feedback
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
