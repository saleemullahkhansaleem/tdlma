"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { forgotPassword } from "@/lib/api/client";
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError((err as Error).message || "Failed to send reset email");
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
              <h2 className="text-xl font-semibold">Check your email</h2>
              <p className="text-sm text-muted-foreground text-center">
                If an account with that email exists, we've sent you a password reset link.
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-muted-foreground text-center">
                Didn't receive an email? Check your spam folder or try again.
              </p>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    setSuccess(false);
                    setEmail("");
                  }}
                  variant="outline"
                  className="rounded-full w-full"
                >
                  Try again
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="rounded-full w-full"
                >
                  <Link href="/login">
                    <ArrowLeft className="h-4 w-4" />
                    Back to login
                  </Link>
                </Button>
              </div>
            </div>
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
            <h2 className="text-xl font-semibold">Forgot Password?</h2>
            <p className="text-sm text-muted-foreground text-center">
              Enter your email address and we'll send you a link to reset your password.
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

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="mt-2 h-11 rounded-full text-base font-semibold"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
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
