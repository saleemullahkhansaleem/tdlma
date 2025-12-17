export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin" | "super_admin";
  status?: "Active" | "Inactive";
  designation?: string;
  userType: "employee" | "student";
  avatarUrl?: string;
  monthlyExpense?: number;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  currentPassword?: string;
  role?: "user" | "admin" | "super_admin";
  status?: "Active" | "Inactive";
  designation?: string;
  userType?: "employee" | "student";
  avatarUrl?: string;
  monthlyExpense?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "super_admin";
  status: "Active" | "Inactive";
  designation: string | null;
  userType: "employee" | "student" | null;
  avatarUrl: string | null;
  monthlyExpense: number;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
