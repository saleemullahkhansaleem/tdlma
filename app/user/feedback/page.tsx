"use client";

import { FeedbackForm } from "@/components/user/feedback-form";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function FeedbackPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted px-4 py-6 md:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4 rounded-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">Submit Feedback</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Share your suggestions, complaints, or feedback with us
          </p>
        </div>
        <FeedbackForm />
      </div>
    </div>
  );
}
