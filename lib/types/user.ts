export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin" | "super_admin";
  avatarUrl?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  role?: "user" | "admin" | "super_admin";
  avatarUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "super_admin";
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
