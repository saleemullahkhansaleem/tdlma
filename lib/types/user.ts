export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  avatarUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
