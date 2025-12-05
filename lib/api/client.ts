import { AppUser } from "@/lib/auth-context";
import {
  CreateFeedbackDto,
  UpdateFeedbackDto,
  Feedback,
  FeedbackWithUser,
} from "@/lib/types/feedback";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function getAuthHeaders(user: AppUser | null): HeadersInit {
  if (!user) return {};

  return {
    "x-user-id": user.id,
    "x-user-email": user.email,
    "x-user-name": user.name,
    "x-user-role": user.role,
    "Content-Type": "application/json",
  };
}

export async function createFeedback(
  data: CreateFeedbackDto,
  user: AppUser
): Promise<Feedback> {
  const response = await fetch(`${API_BASE}/api/feedback`, {
    method: "POST",
    headers: getAuthHeaders(user),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to create feedback" }));
    throw new Error(error.message || "Failed to create feedback");
  }

  return response.json();
}

export async function getUserFeedback(
  user: AppUser,
  filters?: { category?: string; type?: string; status?: string }
): Promise<Feedback[]> {
  const params = new URLSearchParams();
  if (filters?.category) params.append("category", filters.category);
  if (filters?.type) params.append("type", filters.type);
  if (filters?.status) params.append("status", filters.status);

  const response = await fetch(
    `${API_BASE}/api/feedback?${params.toString()}`,
    {
      headers: getAuthHeaders(user),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch feedback");
  }

  return response.json();
}

export async function getFeedbackById(
  id: string,
  user: AppUser
): Promise<Feedback> {
  const response = await fetch(`${API_BASE}/api/feedback/${id}`, {
    headers: getAuthHeaders(user),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch feedback");
  }

  return response.json();
}

export async function updateFeedback(
  id: string,
  data: UpdateFeedbackDto,
  user: AppUser
): Promise<Feedback> {
  const response = await fetch(`${API_BASE}/api/feedback/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(user),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorMessage = "Failed to update feedback";
    try {
      const error = await response.json();
      errorMessage = error.error || error.message || errorMessage;
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function getAdminFeedback(
  user: AppUser,
  filters?: {
    category?: string;
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }
): Promise<{
  feedback: FeedbackWithUser[];
  total: number;
  page: number;
  limit: number;
}> {
  const params = new URLSearchParams();
  if (filters?.category) params.append("category", filters.category);
  if (filters?.type) params.append("type", filters.type);
  if (filters?.status) params.append("status", filters.status);
  if (filters?.page) params.append("page", filters.page.toString());
  if (filters?.limit) params.append("limit", filters.limit.toString());

  const response = await fetch(
    `${API_BASE}/api/feedback/admin?${params.toString()}`,
    {
      headers: getAuthHeaders(user),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch feedback");
  }

  return response.json();
}
