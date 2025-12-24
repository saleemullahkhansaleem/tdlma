"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { resetPassword } from "@/lib/api/client";
import { AlertCircle, CheckCircle2, ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { Label } from "@/components/ui/label";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError("Invalid reset link. Please request a new one.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError((err as Error).message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-muted">
        <Card className="w-full max-w-md shadow-lg rounded-2xl bg-card border-border">
          <CardContent className="p-8 flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold">Password Reset Successful</h2>
              <p className="text-sm text-muted-foreground text-center">
                Your password has been reset successfully. Redirecting to login...
              </p>
            </div>

            <Button
              asChild
              className="rounded-full w-full"
            >
              <Link href="/login">
                Go to Login
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-muted">
      <Card className="w-full max-w-md shadow-lg rounded-2xl bg-card border-border">
        <CardContent className="p-8 flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <Image src="/logo.svg" alt="Logo" width={80} height={80} className="mb-1" />
            <h2 className="text-xl font-semibold">Reset Password</h2>
            <p className="text-sm text-muted-foreground text-center">
              Enter your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label className="pl-4 block">New Password</Label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label className="pl-4 block">Confirm New Password</Label>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="mt-2 h-11 rounded-full text-base font-semibold"
              disabled={loading || !token}
            >
              <Lock className="h-4 w-4" />
              {loading ? "Resetting..." : "Reset Password"}
            </Button>

            <Button
              type="button"
              asChild
              variant="ghost"
              className="rounded-full"
            >
              <Link href="/login">
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center px-4 bg-muted">
        <Card className="w-full max-w-md shadow-lg rounded-2xl bg-card border-border">
          <CardContent className="p-8 flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
              <Image src="/logo.svg" alt="Logo" width={80} height={80} className="mb-1" />
              <h2 className="text-xl font-semibold">Loading...</h2>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
