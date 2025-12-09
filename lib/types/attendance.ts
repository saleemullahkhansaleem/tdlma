export type MealType = "Breakfast" | "Lunch" | "Dinner";
export type AttendanceStatus = "Present" | "Absent" | null;
export type Remark = "All Clear" | "Unclosed" | "Unopened";

export interface Attendance {
  id: string;
  userId: string;
  date: string;
  mealType: MealType;
  status: AttendanceStatus;
  isOpen: boolean; // Whether the meal is open (default: true)
  remark: Remark | null; // Computed from status and isOpen, not stored in DB
  fineAmount: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceWithUser extends Attendance {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  guestCount?: number;
}

export interface CreateAttendanceDto {
  userId: string;
  date: string;
  mealType: MealType;
  status?: AttendanceStatus;
  isOpen?: boolean;
  // remark is computed from status and isOpen, not accepted in DTO
}

export interface UpdateAttendanceDto {
  status?: AttendanceStatus | null;
  isOpen?: boolean;
  // remark is computed from status and isOpen, not accepted in DTO
  fineAmount?: number; // Fine amount in decimal
}
