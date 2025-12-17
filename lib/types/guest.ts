import { MealType } from "./attendance";

export interface Guest {
  id: string;
  inviterId: string;
  name: string;
  date: string;
  mealType: MealType;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGuestDto {
  inviterId: string;
  name: string;
  date: string;
  mealType: MealType;
}
