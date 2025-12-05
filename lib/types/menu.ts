export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

export type WeekType = "Even" | "Odd";

export interface MenuItem {
  name: string;
  imageUrl: string;
  description?: string;
}

export interface Menu {
  id: string;
  dayOfWeek: DayOfWeek;
  weekType: WeekType;
  menuItems: MenuItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMenuDto {
  dayOfWeek: DayOfWeek;
  weekType: WeekType;
  menuItems: MenuItem[];
}

export interface UpdateMenuDto {
  menuItems?: MenuItem[];
}
