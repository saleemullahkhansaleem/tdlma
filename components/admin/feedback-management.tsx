"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { FeedbackWithUser } from "@/lib/types/feedback";
import { getAdminFeedback } from "@/lib/api/client";
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
import { FeedbackResponseModal } from "./feedback-response-modal";
import { FeedbackCategory, FeedbackType, FeedbackStatus } from "@/lib/types/feedback";
import { format } from "date-fns";
import { MessageSquare, Search, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";

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

export function FeedbackManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackList, setFeedbackList] = useState<FeedbackWithUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackWithUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
      const data = await getAdminFeedback(user, {
        ...filters,
        page,
        limit,
      });
      setFeedbackList(data.feedback);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message || "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, [user, filters, page]);

  const handleFilterChange = (key: string, value: string) => {
    if (value === "all") {
      const newFilters = { ...filters };
      delete newFilters[key as keyof typeof filters];
      setFilters(newFilters);
    } else {
      setFilters({ ...filters, [key]: value });
    }
    setPage(1);
  };

  const handleViewFeedback = (feedback: FeedbackWithUser) => {
    setSelectedFeedback(feedback);
    setModalOpen(true);
  };

  const handleUpdate = () => {
    loadFeedback();
  };

  const filteredFeedback = feedbackList.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.user.name.toLowerCase().includes(query) ||
      item.user.email.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(total / limit);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Feedback Management
          </h2>
          <p className="text-sm text-muted-foreground">
            View, filter, and respond to user feedback, suggestions, and complaints
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="space-y-4 rounded-md border bg-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title, description, or user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
          </div>

          <div className="w-full sm:w-auto sm:min-w-[150px]">
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

          <div className="w-full sm:w-auto sm:min-w-[150px]">
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

          <div className="w-full sm:w-auto sm:min-w-[150px]">
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
              onClick={() => {
                setFilters({});
                setPage(1);
              }}
              className="rounded-full w-full sm:w-auto"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      )}

      {/* Stats */}
      {!loading && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredFeedback.length} of {total} feedback entries
        </div>
      )}

      {/* Table */}
      {filteredFeedback.length === 0 && !loading ? (
        <div className="rounded-md border bg-card p-12 text-center">
          <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No feedback found</p>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px] sm:min-w-[200px]">User</TableHead>
                  <TableHead className="min-w-[150px] sm:min-w-[200px]">Title</TableHead>
                  <TableHead className="min-w-[100px]">Category</TableHead>
                  <TableHead className="min-w-[100px]">Type</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[120px]">Date</TableHead>
                  <TableHead className="text-right min-w-[140px] sm:min-w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Skeleton rows
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="min-w-[180px] sm:min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[150px] sm:min-w-[200px]">
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="min-w-[100px]">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </TableCell>
                      <TableCell className="min-w-[100px]">
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                      <TableCell className="min-w-[100px]">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="text-right min-w-[140px] sm:min-w-[160px]">
                        <Skeleton className="h-8 w-32 rounded-full ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  filteredFeedback.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="min-w-[180px] sm:min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <Avatar
                            alt={item.user.name}
                            fallback={item.user.name[0]}
                            className="h-8 w-8 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{item.user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {item.user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[150px] sm:min-w-[200px]">
                        <p className="truncate font-medium">{item.title}</p>
                      </TableCell>
                      <TableCell className="min-w-[100px]">
                        <Badge variant="soft">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="min-w-[100px]">
                        <Badge variant={getTypeColor(item.type)}>
                          {item.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="min-w-[100px]">
                        <Badge variant={getStatusVariant(item.status)}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground min-w-[120px]">
                        {format(new Date(item.createdAt), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="text-right min-w-[140px] sm:min-w-[160px]">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewFeedback(item)}
                          className="rounded-full whitespace-nowrap"
                        >
                          View & Respond
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
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

      <FeedbackResponseModal
        feedback={selectedFeedback}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
