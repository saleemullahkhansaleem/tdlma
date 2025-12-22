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
import { Settings, UpdateSettingsDto } from "@/lib/types/settings";
import { OffDay, CreateOffDayDto, UpdateOffDayDto } from "@/lib/types/off-days";

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
  filters?: { date?: string; mealType?: MealType; inviterId?: string; startDate?: string; endDate?: string }
): Promise<Guest[]> {
  const params = new URLSearchParams();
  if (filters?.date) params.append("date", filters.date);
  if (filters?.mealType) params.append("mealType", filters.mealType);
  if (filters?.inviterId) params.append("inviterId", filters.inviterId);
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);

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

// Settings Management Functions (Admin Only)

export async function getSettings(user: AppUser): Promise<Settings> {
  const response = await fetch(`${API_BASE}/api/settings`, {
    headers: getAuthHeaders(user),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch settings" }));
    throw new Error(error.error || error.message || "Failed to fetch settings");
  }

  return response.json();
}

export async function updateSettings(
  data: UpdateSettingsDto,
  user: AppUser
): Promise<Settings> {
  const response = await fetch(`${API_BASE}/api/settings`, {
    method: "PATCH",
    headers: getAuthHeaders(user),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to update settings" }));
    throw new Error(
      error.error || error.message || "Failed to update settings"
    );
  }

  return response.json();
}

export async function updateSettingField(
  field: "closeTime" | "fineAmountUnclosed" | "fineAmountUnopened" | "guestMealAmount" | "monthlyExpensePerHead",
  value: string | number,
  effectiveDate: string,
  user: AppUser
): Promise<Settings> {
  const response = await fetch(`${API_BASE}/api/settings/field`, {
    method: "PATCH",
    headers: getAuthHeaders(user),
    body: JSON.stringify({
      field,
      value,
      effectiveDate,
    }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to update setting" }));
    throw new Error(
      error.error || error.message || "Failed to update setting"
    );
  }

  return response.json();
}

export interface SettingsHistoryEntry {
  id: string;
  settingKey: string;
  value: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdBy: string;
  createdAt: string;
  creatorName: string | null;
  creatorEmail: string | null;
  description: string;
  unit: string | null;
  valueType: string;
  isActive: boolean;
}

export async function getSettingsHistory(
  user: AppUser,
  settingKey?: string
): Promise<SettingsHistoryEntry[]> {
  // Build URL - handle both absolute and relative paths
  let url: string;
  if (API_BASE) {
    const urlObj = new URL(`${API_BASE}/api/settings/history`);
    if (settingKey) {
      urlObj.searchParams.set("settingKey", settingKey);
    }
    url = urlObj.toString();
  } else {
    // Relative path - build query string manually
    const params = new URLSearchParams();
    if (settingKey) {
      params.set("settingKey", settingKey);
    }
    url = `/api/settings/history${params.toString() ? `?${params.toString()}` : ""}`;
  }

  const response = await fetch(url, {
    headers: getAuthHeaders(user),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch settings history" }));
    throw new Error(
      error.error || error.message || "Failed to fetch settings history"
    );
  }

  return response.json();
}

// Off Days API
export async function getOffDays(user: AppUser): Promise<OffDay[]> {
  const response = await fetch(`${API_BASE}/api/off-days`, {
    headers: getAuthHeaders(user),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch off days" }));
    throw new Error(error.error || error.message || "Failed to fetch off days");
  }

  return response.json();
}

export async function createOffDay(
  data: CreateOffDayDto,
  user: AppUser
): Promise<OffDay> {
  const response = await fetch(`${API_BASE}/api/off-days`, {
    method: "POST",
    headers: getAuthHeaders(user),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to create off day" }));
    throw new Error(error.error || error.message || "Failed to create off day");
  }

  return response.json();
}

export async function updateOffDay(
  id: string,
  data: UpdateOffDayDto,
  user: AppUser
): Promise<OffDay> {
  const response = await fetch(`${API_BASE}/api/off-days/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(user),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to update off day" }));
    throw new Error(error.error || error.message || "Failed to update off day");
  }

  return response.json();
}

export async function deleteOffDay(id: string, user: AppUser): Promise<void> {
  const response = await fetch(`${API_BASE}/api/off-days/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(user),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to delete off day" }));
    throw new Error(error.error || error.message || "Failed to delete off day");
  }
}

// Password Management Functions

export async function forgotPassword(
  email: string
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to request password reset" }));
    throw new Error(
      error.error || error.message || "Failed to request password reset"
    );
  }

  return response.json();
}

export async function resetPassword(
  token: string,
  password: string
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, password }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to reset password" }));
    throw new Error(error.error || error.message || "Failed to reset password");
  }

  return response.json();
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  user: AppUser
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE}/api/auth/change-password`, {
    method: "POST",
    headers: getAuthHeaders(user),
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to change password" }));
    throw new Error(
      error.error || error.message || "Failed to change password"
    );
  }

  return response.json();
}

// Dashboard Stats Functions (Admin Only)

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  employeeCount: number;
  studentCount: number;
  today: {
    mealsBooked: number;
    mealsClosed: number;
    present: number;
    absent: number;
    unclosed: number;
    unopened: number;
    totalLoss: number;
  };
  period: {
    present: number;
    absent: number;
    unclosed: number;
    unopened: number;
    totalFine: number;
  };
  trends: Array<{
    date: string;
    present: number;
    absent: number;
    unclosed: number;
    unopened: number;
  }>;
  financial: {
    totalDues: number;
    totalPayments: number;
    pendingDues: number;
    guestCount: number;
    totalGuestExpense: number;
    totalBaseExpense: number;
    totalFines: number;
  };
  operational: {
    openMeals: number;
    closedMeals: number;
    usersWithUnpaidBalances: number;
    topUsersByDues: Array<{
      userId: string;
      userName: string;
      dues: number;
    }>;
    recentGuests: Array<{
      id: string;
      name: string;
      date: string;
      inviterName: string;
    }>;
    recentFines: Array<{
      userId: string;
      userName: string;
      amount: number;
      date: string;
    }>;
  };
  feedback: {
    newCount: number;
    pendingCount: number;
    recentFeedback: Array<{
      id: string;
      title: string;
      status: string;
      userName: string;
      createdAt: string;
    }>;
  };
}

export async function getDashboardStats(
  user: AppUser,
  period: "today" | "week" | "month" = "today"
): Promise<DashboardStats> {
  const response = await fetch(
    `${API_BASE}/api/admin/dashboard-stats?period=${period}`,
    {
      headers: getAuthHeaders(user),
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch dashboard stats" }));
    throw new Error(
      error.error || error.message || "Failed to fetch dashboard stats"
    );
  }

  return response.json();
}

// Profile Management Functions

export interface MonthlyExpenses {
  mealExpenses: number;
  guestExpenses: number;
  totalFines: number;
  monthlyExpense: number;
  totalMonthlyExpense: number;
  month: {
    start: string;
    end: string;
    year: number;
    month: number;
  };
}

export async function getMonthlyExpenses(
  user: AppUser,
  year?: number,
  month?: number
): Promise<MonthlyExpenses> {
  const params = new URLSearchParams();
  if (year) params.set("year", year.toString());
  if (month) params.set("month", month.toString());

  const response = await fetch(
    `${API_BASE}/api/user/dashboard-stats?${params.toString()}`,
    {
      headers: getAuthHeaders(user),
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch monthly expenses" }));
    throw new Error(
      error.error || error.message || "Failed to fetch monthly expenses"
    );
  }

  return response.json();
}

export async function getProfile(user: AppUser): Promise<User> {
  const response = await fetch(`${API_BASE}/api/user/profile`, {
    headers: getAuthHeaders(user),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch profile" }));
    throw new Error(error.error || error.message || "Failed to fetch profile");
  }

  return response.json();
}

export async function updateProfile(
  data: UpdateUserDto,
  user: AppUser
): Promise<User> {
  const response = await fetch(`${API_BASE}/api/user/profile`, {
    method: "PATCH",
    headers: getAuthHeaders(user),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to update profile" }));
    throw new Error(error.error || error.message || "Failed to update profile");
  }

  return response.json();
}

// Payment Management Functions

export interface UserWithDues {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  totalDues: number;
  lastPaymentDate: Date | null;
}

export interface Transaction {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string } | null;
  amount: number;
  type: "paid" | "reduced" | "waived";
  description: string | null;
  createdBy: string;
  createdByUser: { id: string; name: string; email: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentDto {
  userId: string;
  amount: number;
  type: "paid" | "reduced" | "waived";
  description?: string;
}

export async function getUsersWithDues(
  user: AppUser
): Promise<UserWithDues[]> {
  const response = await fetch(`${API_BASE}/api/payments/users`, {
    headers: getAuthHeaders(user),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch users with dues" }));
    throw new Error(
      error.error || error.message || "Failed to fetch users with dues"
    );
  }

  return response.json();
}

export async function getTransactions(
  user: AppUser,
  filters?: {
    userId?: string;
    startDate?: string;
    endDate?: string;
    type?: "paid" | "reduced" | "waived";
  }
): Promise<Transaction[]> {
  const params = new URLSearchParams();
  if (filters?.userId) params.set("userId", filters.userId);
  if (filters?.startDate) params.set("startDate", filters.startDate);
  if (filters?.endDate) params.set("endDate", filters.endDate);
  if (filters?.type) params.set("type", filters.type);

  const response = await fetch(
    `${API_BASE}/api/payments?${params.toString()}`,
    {
      headers: getAuthHeaders(user),
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch transactions" }));
    throw new Error(
      error.error || error.message || "Failed to fetch transactions"
    );
  }

  return response.json();
}

export async function createPayment(
  data: CreatePaymentDto,
  user: AppUser
): Promise<Transaction & { updatedDues: number }> {
  const response = await fetch(`${API_BASE}/api/payments`, {
    method: "POST",
    headers: getAuthHeaders(user),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to create payment" }));
    throw new Error(
      error.error || error.message || "Failed to create payment"
    );
  }

  return response.json();
}

// Reports Functions

export interface UserReportData {
  userId: string;
  userName: string;
  userEmail: string;
  avatarUrl: string | null;
  totalOpened: number;
  totalClosed: number;
  totalUnopened: number;
  totalUnclosed: number;
  totalFine: number;
  guestCount: number;
  guestExpense: number;
  baseExpense: number;
  totalDues: number;
}

export interface ReportsStats {
  totalDays: number;
  workDays: number;
  sundays: number;
  totalUsers: number;
  totalFine: number;
  totalOpened: number;
  totalClosed: number;
  totalUnopened: number;
  totalUnclosed: number;
  totalGuests: number;
  totalGuestExpenses: number;
  totalBaseExpenses: number;
  totalDues: number;
}

export interface ReportsResponse {
  reports: UserReportData[];
  stats: ReportsStats;
  dateRange: {
    start: string;
    end: string;
  };
}

export async function getReports(
  user: AppUser,
  startDate: string,
  endDate: string
): Promise<ReportsResponse> {
  const params = new URLSearchParams();
  params.set("startDate", startDate);
  params.set("endDate", endDate);

  const response = await fetch(
    `${API_BASE}/api/admin/reports?${params.toString()}`,
    {
      headers: getAuthHeaders(user),
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch reports" }));
    throw new Error(
      error.error || error.message || "Failed to fetch reports"
    );
  }

  return response.json();
}
