"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError((err as Error).message || "Login failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-muted">
      <Card className="w-full max-w-md shadow-lg rounded-2xl bg-card border-border">
        <CardContent className="p-8 flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <Image src="/logo.svg" alt="Logo" width={80} height={80} className="mb-1" />
            <h1 className="text-lg font-semibold">TDLMA - Tensai Devs Food</h1>
            <p className="text-sm text-muted-foreground text-center">
              Login to manage your lunch bookings
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label className="pl-4 block">Email</Label>
              <Input
                type="email"
                placeholder="Type Here"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="pl-4 block">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs text-destructive text-center mt-1 p-3 bg-destructive/10 rounded-md border border-destructive/20">
                <p className="font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="mt-2 h-11 rounded-full text-base font-semibold"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

            <div className="flex items-center justify-center pt-2">
              <ThemeToggle size="icon" variant="ghost" />
            </div>
          </form>

          {/* <p className="text-center text-xs text-muted-foreground">
            Don&apos;t have an account? <span className="text-primary font-medium">Signup</span>
          </p> */}
        </CardContent>
      </Card>
    </div>
  );
}
