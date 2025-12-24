"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { AdminModule, ADMIN_MODULES } from "@/lib/utils/permissions";

export interface AdminPermissions {
  [key: string]: boolean;
}

export function useAdminPermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Record<AdminModule, boolean> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Superadmin always has all permissions
    if (user.role === "super_admin") {
      const allPermissions: Record<AdminModule, boolean> = {} as Record<AdminModule, boolean>;
      ADMIN_MODULES.forEach((module) => {
        allPermissions[module] = true;
      });
      setPermissions(allPermissions);
      setLoading(false);
      return;
    }

    // Regular admins need to fetch permissions
    if (user.role === "admin") {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/admin/permissions/${user.id}`, {
          headers: {
            "x-user-id": user.id,
            "x-user-email": user.email,
            "x-user-name": user.name,
            "x-user-role": user.role,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          // If 404 or 403, it means no permissions set yet (default state - not an error)
          if (response.status === 404 || response.status === 403) {
            const noPermissions: Record<AdminModule, boolean> = {} as Record<AdminModule, boolean>;
            ADMIN_MODULES.forEach((module) => {
              noPermissions[module] = false;
            });
            setPermissions(noPermissions);
            setError(null);
            return;
          }
          // For other errors, throw
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch permissions");
        }

        const data = await response.json();
        // Initialize all modules to false, then set from response
        const result: Record<AdminModule, boolean> = {} as Record<AdminModule, boolean>;
        ADMIN_MODULES.forEach((module) => {
          result[module] = false;
        });
        if (data.permissions) {
          Object.entries(data.permissions).forEach(([module, allowed]) => {
            if (ADMIN_MODULES.includes(module as AdminModule)) {
              result[module as AdminModule] = allowed as boolean;
            }
          });
        }
        setPermissions(result);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching permissions:", err);
        // Default to no permissions on error (this is expected for new admins)
        const noPermissions: Record<AdminModule, boolean> = {} as Record<AdminModule, boolean>;
        ADMIN_MODULES.forEach((module) => {
          noPermissions[module] = false;
        });
        setPermissions(noPermissions);
        // Only set error for unexpected errors, not for "no permissions" state
        if (!err.message?.includes("404") && !err.message?.includes("403")) {
          setError(err.message || "Failed to fetch permissions");
        } else {
          setError(null);
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Not an admin, no permissions
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPermissions();
    
    // Listen for permission updates
    const handlePermissionUpdate = () => {
      fetchPermissions();
    };
    
    if (typeof window !== "undefined") {
      window.addEventListener("adminPermissionsUpdated", handlePermissionUpdate);
      
      return () => {
        window.removeEventListener("adminPermissionsUpdated", handlePermissionUpdate);
      };
    }
  }, [fetchPermissions]);

  const refresh = useCallback(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = (module: AdminModule): boolean => {
    if (!user) return false;
    if (user.role === "super_admin") return true;
    if (user.role !== "admin") return false;
    if (!permissions) return false;
    return permissions[module] ?? false;
  };

  const getAllowedModules = (): AdminModule[] => {
    if (!permissions) return [];
    return ADMIN_MODULES.filter((module) => permissions[module]);
  };

  return {
    permissions,
    loading,
    error,
    hasPermission,
    getAllowedModules,
    refresh,
  };
}

