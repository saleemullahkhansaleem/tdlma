/**
 * Maps notification types to their corresponding routes based on user role
 * @param type - The notification type
 * @param userRole - The user's role (admin, super_admin, or user)
 * @returns The route path or null if no route is mapped
 */
export function getNotificationRoute(
  type: string,
  userRole: string
): string | null {
  const isAdmin = userRole === "admin" || userRole === "super_admin";

  if (isAdmin) {
    // Admin routes
    switch (type) {
      case "feedback_received":
        return "/admin/feedback";
      case "settings_updated":
        return "/admin/settings";
      case "menu_updated":
      case "menu_created":
        return "/admin/menu";
      case "admin_notification":
        // Generic admin notifications - could navigate to notifications page or stay
        return "/admin/notifications";
      default:
        return null;
    }
  } else {
    // User routes
    switch (type) {
      case "feedback_responded":
      case "feedback_status_changed":
        return "/user/my-feedback";
      case "guest_added":
      case "fine_added":
      case "payment_processed":
        return "/user/transactions";
      case "settings_updated":
      case "menu_updated":
      case "menu_created":
      case "meal_status_changed":
        return "/user/dashboard";
      case "password_changed":
      case "password_changed_by_admin":
        return "/user/profile";
      default:
        return null;
    }
  }
}

