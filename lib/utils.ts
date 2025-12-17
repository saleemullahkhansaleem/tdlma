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

/**
 * Check if a date is a weekend (Saturday or Sunday)
 * @param dateString - Date in YYYY-MM-DD format
 * @returns true if the date is a weekend
 */
export function isWeekend(dateString: string): boolean {
  const date = new Date(dateString);
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Check if a date is an off-day (holiday)
 * @param dateString - Date in YYYY-MM-DD format
 * @param offDays - Array of off-day dates
 * @returns true if the date is an off-day
 */
export function isOffDay(dateString: string, offDays: string[]): boolean {
  return offDays.includes(dateString);
}
