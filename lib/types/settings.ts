export interface Settings {
  id: string;
  closeTime: string; // Format: HH:mm
  fineAmountUnclosed: number;
  fineAmountUnopened: number;
  disabledDates: string[]; // Array of date strings in YYYY-MM-DD format
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateSettingsDto {
  closeTime?: string;
  fineAmountUnclosed?: number;
  fineAmountUnopened?: number;
  disabledDates?: string[];
}
