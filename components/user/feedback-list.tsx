"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Feedback } from "@/lib/types/feedback";
import { getUserFeedback } from "@/lib/api/client";
import { FeedbackCard } from "./feedback-card";
import { FeedbackCardSkeleton } from "./feedback-card-skeleton";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FeedbackCategory, FeedbackType, FeedbackStatus } from "@/lib/types/feedback";

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
const STATUSES: FeedbackStatus[] = ["Pending", "Reviewed", "Resolved"];

export function FeedbackList() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [filters, setFilters] = useState<{
    category?: string;
    type?: string;
    status?: string;
  }>({});

  const loadFeedback = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getUserFeedback(user, filters);
      setFeedbackList(data);
    } catch (err: any) {
      setError(err.message || "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, [user, filters]);

  const handleFilterChange = (key: string, value: string) => {
    if (value === "all") {
      const newFilters = { ...filters };
      delete newFilters[key as keyof typeof filters];
      setFilters(newFilters);
    } else {
      setFilters({ ...filters, [key]: value });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Filters Skeleton */}
        <div className="flex flex-wrap gap-3 rounded-md border bg-card p-4">
          <Skeleton className="h-10 flex-1 min-w-[150px]" />
          <Skeleton className="h-10 flex-1 min-w-[150px]" />
          <Skeleton className="h-10 flex-1 min-w-[150px]" />
        </div>

        {/* Feedback Cards Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <FeedbackCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-md border bg-card p-4">
        <div className="flex-1 min-w-[150px]">
          <Select
            value={filters.category || "all"}
            onValueChange={(value) => handleFilterChange("category", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <Select
            value={filters.type || "all"}
            onValueChange={(value) => handleFilterChange("type", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <Select
            value={filters.status || "all"}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(filters.category || filters.type || filters.status) && (
          <Button
            variant="outline"
            onClick={() => setFilters({})}
            className="rounded-full"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Feedback List */}
      {feedbackList.length === 0 ? (
        <div className="rounded-md border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            {Object.keys(filters).length > 0
              ? "No feedback matches your filters"
              : "You haven't submitted any feedback yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbackList.map((item) => (
            <FeedbackCard key={item.id} feedback={item} />
          ))}
        </div>
      )}
    </div>
  );
}
