export interface Settings {
  id: string;
  closeTime: string; // Format: HH:mm
  fineAmountUnclosed: number;
  fineAmountUnopened: number;
  guestMealAmount: number;
  monthlyExpensePerHead: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateSettingsDto {
  closeTime?: string;
  fineAmountUnclosed?: number;
  fineAmountUnclosedEffectiveDate?: string; // YYYY-MM-DD format, required if fineAmountUnclosed is provided
  fineAmountUnopened?: number;
  fineAmountUnopenedEffectiveDate?: string; // YYYY-MM-DD format, required if fineAmountUnopened is provided
  guestMealAmount?: number;
  guestMealAmountEffectiveDate?: string; // YYYY-MM-DD format, required if guestMealAmount is provided
  monthlyExpensePerHead?: number;
  monthlyExpensePerHeadEffectiveDate?: string; // YYYY-MM-DD format, required if monthlyExpensePerHead is provided
  closeTimeEffectiveDate?: string; // YYYY-MM-DD format, required if closeTime is provided
}
