import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate remark based on attendance status and isOpen flag
 * @param status - Attendance status: "Present", "Absent", or null
 * @param isOpen - Whether the meal is open (default: true)
 * @returns Calculated remark: "All Clear", "Unclosed", "Unopened", or null
 */
export function calculateRemark(
  status: "Present" | "Absent" | null,
  isOpen: boolean
): "All Clear" | "Unclosed" | "Unopened" | null {
  if (status === null) return null;

  if (status === "Present" && isOpen) {
    return "All Clear";
  }
  if (status === "Absent" && !isOpen) {
    return "All Clear";
  }
  if (status === "Absent" && isOpen) {
    return "Unclosed";
  }
  if (status === "Present" && !isOpen) {
    return "Unopened";
  }

  return null;
}
