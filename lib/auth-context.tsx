"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

export type UserRole = "user" | "admin";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Simple mock users; replace with real API later
const MOCK_USERS: AppUser[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
  },
  {
    id: "2",
    name: "Regular User",
    email: "user@example.com",
    role: "user",
  },
];

const STORAGE_KEY = "tdlma_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      if (!pathname?.startsWith("/login")) {
        router.replace("/login");
      }
      return;
    }

    // Redirect based on role from login or direct visits
    if (pathname === "/" || pathname === "/login") {
      if (user.role === "admin") router.replace("/admin/dashboard");
      else router.replace("/");
    }
  }, [user, loading, pathname, router]);

  async function login(email: string, password: string) {
    setLoading(true);
    // Simulate API call; later call Node/Express backend here
    await new Promise((r) => setTimeout(r, 500));

    const found = MOCK_USERS.find((u) => u.email === email.trim().toLowerCase());
    if (!found) {
      setLoading(false);
      throw new Error("Invalid credentials");
    }

    setUser(found);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
    }

    if (found.role === "admin") router.replace("/admin/dashboard");
    else router.replace("/");

    setLoading(false);
  }

  function logout() {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    router.replace("/login");
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
