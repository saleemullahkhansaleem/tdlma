import { AppUser } from "@/lib/auth-context";
import {
  CreateFeedbackDto,
  UpdateFeedbackDto,
  Feedback,
  FeedbackWithUser,
} from "@/lib/types/feedback";
import { CreateUserDto, UpdateUserDto, User } from "@/lib/types/user";
import {
  Menu,
  CreateMenuDto,
  UpdateMenuDto,
  DayOfWeek,
  WeekType,
} from "@/lib/types/menu";
import {
  AttendanceWithUser,
  CreateAttendanceDto,
  UpdateAttendanceDto,
  MealType,
} from "@/lib/types/attendance";
import { CreateGuestDto, Guest } from "@/lib/types/guest";

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

// User Management Functions (Super Admin Only)

export async function getAllUsers(user: AppUser): Promise<User[]> {
  const response = await fetch(`${API_BASE}/api/users`, {
    headers: getAuthHeaders(user),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch users" }));
    throw new Error(error.error || error.message || "Failed to fetch users");
  }

  return response.json();
}

export async function getUserById(id: string, user: AppUser): Promise<User> {
  const response = await fetch(`${API_BASE}/api/users/${id}`, {
    headers: getAuthHeaders(user),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch user" }));
    throw new Error(error.error || error.message || "Failed to fetch user");
  }

  return response.json();
}

export async function createUser(
  data: CreateUserDto,
  user: AppUser
): Promise<User> {
  const response = await fetch(`${API_BASE}/api/users`, {
    method: "POST",
    headers: getAuthHeaders(user),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to create user" }));
    throw new Error(error.error || error.message || "Failed to create user");
  }

  return response.json();
}

export async function updateUser(
  id: string,
  data: UpdateUserDto,
  user: AppUser
): Promise<User> {
  const response = await fetch(`${API_BASE}/api/users/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(user),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to update user" }));
    throw new Error(error.error || error.message || "Failed to update user");
  }

  return response.json();
}

export async function deleteUser(id: string, user: AppUser): Promise<void> {
  const response = await fetch(`${API_BASE}/api/users/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(user),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to delete user" }));
    throw new Error(error.error || error.message || "Failed to delete user");
  }
}

// Menu Management Functions (Admin Only)

export async function getAllMenus(
  user: AppUser,
  filters?: { weekType?: WeekType; dayOfWeek?: DayOfWeek }
): Promise<Menu[]> {
  const params = new URLSearchParams();
  if (filters?.weekType) params.append("weekType", filters.weekType);
  if (filters?.dayOfWeek) params.append("dayOfWeek", filters.dayOfWeek);

  const response = await fetch(`${API_BASE}/api/menu?${params.toString()}`, {
    headers: getAuthHeaders(user),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch menus" }));
    throw new Error(error.error || error.message || "Failed to fetch menus");
  }

  return response.json();
}

export async function getMenuById(id: string, user: AppUser): Promise<Menu> {
  const response = await fetch(`${API_BASE}/api/menu/${id}`, {
    headers: getAuthHeaders(user),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch menu" }));
    throw new Error(error.error || error.message || "Failed to fetch menu");
  }

  return response.json();
}

export async function createMenu(
  data: CreateMenuDto,
  user: AppUser
): Promise<Menu> {
  const response = await fetch(`${API_BASE}/api/menu`, {
    method: "POST",
    headers: getAuthHeaders(user),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to create menu" }));
    throw new Error(error.error || error.message || "Failed to create menu");
  }

  return response.json();
}

export async function updateMenu(
  id: string,
  data: UpdateMenuDto,
  user: AppUser
): Promise<Menu> {
  const response = await fetch(`${API_BASE}/api/menu/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(user),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to update menu" }));
    throw new Error(error.error || error.message || "Failed to update menu");
  }

  return response.json();
}

export async function deleteMenu(id: string, user: AppUser): Promise<void> {
  const response = await fetch(`${API_BASE}/api/menu/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(user),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to delete menu" }));
    throw new Error(error.error || error.message || "Failed to delete menu");
  }
}

// Attendance Management Functions (Admin Only)

export async function getAttendance(
  user: AppUser,
  filters?: { date?: string; mealType?: MealType }
): Promise<AttendanceWithUser[]> {
  const params = new URLSearchParams();
  if (filters?.date) params.append("date", filters.date);
  if (filters?.mealType) params.append("mealType", filters.mealType);

  const response = await fetch(
    `${API_BASE}/api/attendance?${params.toString()}`,
    {
      headers: getAuthHeaders(user),
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch attendance" }));
    throw new Error(
      error.error || error.message || "Failed to fetch attendance"
    );
  }

  return response.json();
}

export async function createAttendance(
  data: CreateAttendanceDto,
  user: AppUser
): Promise<any> {
  const response = await fetch(`${API_BASE}/api/attendance`, {
    method: "POST",
    headers: getAuthHeaders(user),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to create attendance" }));
    throw new Error(
      error.error || error.message || "Failed to create attendance"
    );
  }

  return response.json();
}

export async function updateAttendance(
  id: string,
  data: UpdateAttendanceDto,
  user: AppUser
): Promise<any> {
  const response = await fetch(`${API_BASE}/api/attendance/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(user),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to update attendance" }));
    throw new Error(
      error.error || error.message || "Failed to update attendance"
    );
  }

  return response.json();
}

export async function deleteAttendance(
  id: string,
  user: AppUser
): Promise<void> {
  const response = await fetch(`${API_BASE}/api/attendance/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(user),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to delete attendance" }));
    throw new Error(
      error.error || error.message || "Failed to delete attendance"
    );
  }
}

// Guest Management Functions (Admin Only)

export async function createGuest(
  data: CreateGuestDto | CreateGuestDto[],
  user: AppUser
): Promise<Guest | Guest[]> {
  const response = await fetch(`${API_BASE}/api/guests`, {
    method: "POST",
    headers: getAuthHeaders(user),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to create guest" }));
    throw new Error(error.error || error.message || "Failed to create guest");
  }

  return response.json();
}

export async function getGuests(
  user: AppUser,
  filters?: { date?: string; mealType?: MealType; inviterId?: string }
): Promise<Guest[]> {
  const params = new URLSearchParams();
  if (filters?.date) params.append("date", filters.date);
  if (filters?.mealType) params.append("mealType", filters.mealType);
  if (filters?.inviterId) params.append("inviterId", filters.inviterId);

  const response = await fetch(`${API_BASE}/api/guests?${params.toString()}`, {
    headers: getAuthHeaders(user),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch guests" }));
    throw new Error(error.error || error.message || "Failed to fetch guests");
  }

  return response.json();
}
