"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("");
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
            <p className="text-sm text-muted-foreground text-center">
              Login to manage your lunch bookings
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 text-sm">
              <label className="font-medium">Email</label>
              <Input
                type="email"
                placeholder="Type Here"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex items-center justify-between">
                <label className="font-medium">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-xs text-destructive text-center mt-1">{error}</p>
            )}

            <Button
              type="submit"
              className="mt-2 h-11 rounded-full text-base font-semibold"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-full flex items-center justify-center gap-2"
            >
              <Image src="/google-logo.webp" alt="Google" width={18} height={18} />
              <span className="text-sm">Login with Google</span>
            </Button>
          </form>

          {/* <p className="text-center text-xs text-muted-foreground">
            Don&apos;t have an account? <span className="text-primary font-medium">Signup</span>
          </p> */}
        </CardContent>
      </Card>
    </div>
  );
}
