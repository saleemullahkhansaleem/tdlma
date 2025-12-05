import { NextRequest } from "next/server";
import { AppUser } from "../auth-context";

export interface AuthenticatedRequest extends NextRequest {
  user?: AppUser;
}

export function getAuthUser(request: NextRequest): AppUser | null {
  // Get user info from headers (sent by frontend)
  const userId = request.headers.get("x-user-id");
  const userEmail = request.headers.get("x-user-email");
  const userName = request.headers.get("x-user-name");
  const userRole = request.headers.get("x-user-role") as
    | "user"
    | "admin"
    | null;

  if (!userId || !userEmail || !userName || !userRole) {
    return null;
  }

  return {
    id: userId,
    email: userEmail,
    name: userName,
    role: userRole,
  };
}

export function requireAuth(request: NextRequest): AppUser {
  const user = getAuthUser(request);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export function requireAdmin(request: NextRequest): AppUser {
  const user = requireAuth(request);
  if (user.role !== "admin") {
    throw new Error("Forbidden: Admin access required");
  }
  return user;
}
