export type MealType = "Breakfast" | "Lunch" | "Dinner";
export type AttendanceStatus = "Present" | "Absent" | null;
export type Remark = "All Clear" | "Unclosed" | "Unopened";

export interface Attendance {
  id: string;
  userId: string;
  date: string;
  mealType: MealType;
  status: AttendanceStatus;
  remark: Remark | null;
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
  remark?: Remark;
}

export interface UpdateAttendanceDto {
  status?: AttendanceStatus | null;
  remark?: Remark | null;
}
