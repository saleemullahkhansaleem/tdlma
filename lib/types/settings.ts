export interface Settings {
  id: string;
  closeTime: string; // Format: HH:mm
  fineAmountUnclosed: number;
  fineAmountUnopened: number;
  guestMealAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateSettingsDto {
  closeTime?: string;
  fineAmountUnclosed?: number;
  fineAmountUnopened?: number;
  guestMealAmount?: number;
}
