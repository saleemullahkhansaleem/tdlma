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
export const userStatusEnum = pgEnum("user_status", ["Active", "Inactive"]);
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
export const userTypeEnum = pgEnum("user_type", ["employee", "student"]);

// Users Table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull(),
  status: userStatusEnum("status").default("Active").notNull(),
  designation: varchar("designation", { length: 255 }),
  userType: userTypeEnum("user_type"),
  avatarUrl: varchar("avatar_url", { length: 512 }),
  monthlyExpense: decimal("monthly_expense", { precision: 10, scale: 2 }).default("0"),
  emailVerified: boolean("email_verified").default(false).notNull(),
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
  isOpen: boolean("is_open").default(true).notNull(), // Default to open, user can close it
  // remark is calculated from status and isOpen, not stored in DB
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
  amount: decimal("amount", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Settings Table (Global settings, single row)
export const settings = pgTable("settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  closeTime: varchar("close_time", { length: 5 }).default("18:00").notNull(), // Format: HH:mm
  fineAmountUnclosed: decimal("fine_amount_unclosed", {
    precision: 10,
    scale: 2,
  })
    .default("0")
    .notNull(),
  fineAmountUnopened: decimal("fine_amount_unopened", {
    precision: 10,
    scale: 2,
  })
    .default("0")
    .notNull(),
  guestMealAmount: decimal("guest_meal_amount", {
    precision: 10,
    scale: 2,
  })
    .default("0")
    .notNull(),
  monthlyExpensePerHead: decimal("monthly_expense_per_head", {
    precision: 10,
    scale: 2,
  })
    .default("0")
    .notNull(),
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

// Off Days Table
export const offDays = pgTable("off_days", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: date("date").notNull().unique(),
  reason: text("reason").notNull(), // Clarification text explaining why it's an off day
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Password Reset Tokens Table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Audit Logs Table
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  action: varchar("action", { length: 100 }).notNull(), // e.g., "CREATE_USER", "UPDATE_ATTENDANCE"
  entityType: varchar("entity_type", { length: 50 }).notNull(), // e.g., "user", "attendance", "guest"
  entityId: uuid("entity_id"),
  details: json("details"), // Additional details about the action
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notifications Table
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: varchar("type", { length: 50 }).notNull(), // e.g., "guest_added", "expense_updated"
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Email Verification Tokens Table
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
