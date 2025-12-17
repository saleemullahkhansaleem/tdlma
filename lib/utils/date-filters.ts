import { DayOfWeek } from "@/lib/types/menu";

export type FilterType =
  | "This Week"
  | "10 Days"
  | "Last 10 Days"
  | "Last 30 Days"
  | "30 Days"
  | "This Month";

export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

export function getFilterDates(filter: FilterType): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates: Date[] = [];

  switch (filter) {
    case "This Week": {
      const monday = getMondayOfWeek(today);
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        dates.push(date);
      }
      break;
    }
    case "10 Days": {
      // Next 10 days (including today)
      for (let i = 0; i < 10; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date);
      }
      break;
    }
    case "Last 10 Days": {
      // Last 10 days (including today)
      for (let i = 9; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date);
      }
      break;
    }
    case "Last 30 Days": {
      // Last 30 days (including today)
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date);
      }
      break;
    }
    case "30 Days": {
      // Last 30 days (including today) - same as "Last 30 Days"
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date);
      }
      break;
    }
    case "This Month": {
      const year = today.getFullYear();
      const month = today.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      for (
        let d = new Date(firstDay);
        d <= lastDay;
        d.setDate(d.getDate() + 1)
      ) {
        dates.push(new Date(d));
      }
      break;
    }
  }

  return dates;
}

export function getDayOfWeek(date: Date): DayOfWeek | null {
  const dayIndex = date.getDay();
  if (dayIndex === 0) return null; // Sunday - no menu
  const days: DayOfWeek[] = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[dayIndex - 1] || null;
}

export function formatDateLabel(date: Date): { day: string; sub: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateCopy = new Date(date);
  dateCopy.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const dayName = dayNames[date.getDay()];
  const formattedDate = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  let sub = "";
  if (dateCopy.getTime() === today.getTime()) {
    sub = "Today";
  } else if (dateCopy.getTime() === yesterday.getTime()) {
    sub = "Yesterday";
  } else if (dateCopy.getTime() === tomorrow.getTime()) {
    sub = "Tomorrow";
  }

  return {
    day: `${dayName}, ${formattedDate}`,
    sub,
  };
}
