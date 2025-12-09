export interface OffDay {
  id: string;
  date: string; // Format: YYYY-MM-DD
  reason: string; // Clarification text explaining why it's an off day
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOffDayDto {
  date: string; // Format: YYYY-MM-DD
  reason: string;
}

export interface UpdateOffDayDto {
  date?: string;
  reason?: string;
}
