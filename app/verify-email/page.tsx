"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          setStatus("error");
          setMessage(data.error || "Verification failed");
          return;
        }

        setStatus("success");
        setMessage("Email verified successfully! You can now log in.");
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred during verification");
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-muted">
      <Card className="w-full max-w-md shadow-lg rounded-2xl bg-card border-border">
        <CardContent className="p-8 flex flex-col items-center gap-6 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <h2 className="text-2xl font-bold">Verifying Email...</h2>
              <p className="text-muted-foreground">
                Please wait while we verify your email address.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <h2 className="text-2xl font-bold">Email Verified!</h2>
              <p className="text-muted-foreground">{message}</p>
              <Button onClick={() => router.push("/login")} className="mt-4">
                Go to Login
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <h2 className="text-2xl font-bold">Verification Failed</h2>
              <p className="text-muted-foreground">{message}</p>
              <Button onClick={() => router.push("/login")} variant="outline" className="mt-4">
                Go to Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center px-4 bg-muted">
        <Card className="w-full max-w-md shadow-lg rounded-2xl bg-card border-border">
          <CardContent className="p-8 flex flex-col items-center gap-6 text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <h2 className="text-2xl font-bold">Loading...</h2>
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}



