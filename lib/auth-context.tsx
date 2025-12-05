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

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Login failed" }));
        throw new Error(error.error || "Invalid credentials");
      }

      const userData = await response.json();

      // Map database user to AppUser format
      const appUser: AppUser = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
      };

      setUser(appUser);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appUser));
      }

      if (appUser.role === "admin") router.replace("/admin/dashboard");
      else router.replace("/");
    } catch (error: any) {
      setLoading(false);
      throw error;
    }

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
