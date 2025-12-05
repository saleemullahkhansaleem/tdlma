import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  boolean,
  pgEnum,
  json,
  date,
  integer,
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "user",
  "admin",
  "super_admin",
]);
export const dayOfWeekEnum = pgEnum("day_of_week", [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]);
export const weekTypeEnum = pgEnum("week_type", ["Even", "Odd"]);
export const mealTypeEnum = pgEnum("meal_type", [
  "Breakfast",
  "Lunch",
  "Dinner",
]);
export const attendanceStatusEnum = pgEnum("attendance_status", [
  "Present",
  "Absent",
]);
export const remarkEnum = pgEnum("remark", [
  "All Clear",
  "Unclosed",
  "Unopened",
]);
export const themeEnum = pgEnum("theme", ["light", "dark"]);
export const feedbackCategoryEnum = pgEnum("feedback_category", [
  "Food",
  "Meal Timing",
  "Service",
  "Attendance",
  "App",
  "Menu",
  "Environment",
  "Suggestion",
  "Other",
]);
export const feedbackTypeEnum = pgEnum("feedback_type", [
  "Suggestion",
  "Complaint",
  "Feedback",
]);
export const feedbackStatusEnum = pgEnum("feedback_status", [
  "Pending",
  "Reviewed",
  "Resolved",
]);

// Users Table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull(),
  avatarUrl: varchar("avatar_url", { length: 512 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Menu Table
export const menus = pgTable("menus", {
  id: uuid("id").defaultRandom().primaryKey(),
  dayOfWeek: dayOfWeekEnum("day_of_week").notNull(),
  weekType: weekTypeEnum("week_type").notNull(),
  menuItems: json("menu_items").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Attendance Table
export const attendance = pgTable("attendance", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  date: date("date").notNull(),
  mealType: mealTypeEnum("meal_type").notNull(),
  status: attendanceStatusEnum("status"),
  remark: remarkEnum("remark"),
  fineAmount: decimal("fine_amount", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Reports Table
export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  totalOpened: integer("total_opened").default(0),
  totalClosed: integer("total_closed").default(0),
  totalUnopened: integer("total_unopened").default(0),
  totalUnclosed: integer("total_unclosed").default(0),
  totalFine: decimal("total_fine", { precision: 10, scale: 2 }).default("0"),
  reportDate: date("report_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Guests Table
export const guests = pgTable("guests", {
  id: uuid("id").defaultRandom().primaryKey(),
  inviterId: uuid("inviter_id")
    .references(() => users.id)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  date: date("date").notNull(),
  mealType: mealTypeEnum("meal_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Settings Table
export const settings = pgTable("settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull()
    .unique(),
  theme: themeEnum("theme").default("light"),
  notifications: boolean("notifications").default(true),
  language: varchar("language", { length: 10 }).default("en"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Feedback Table
export const feedback = pgTable("feedback", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  category: feedbackCategoryEnum("category").notNull(),
  type: feedbackTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: feedbackStatusEnum("status").default("Pending"),
  response: text("response"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
