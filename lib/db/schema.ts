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
  jsonb,
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
export const transactionTypeEnum = pgEnum("transaction_type", [
  "paid",
  "reduced",
  "waived",
]);

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
  totalDues: decimal("total_dues", { precision: 10, scale: 2 }).default("0").notNull(),
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

// Settings Table (Normalized settings definitions - metadata only)
// Current values are stored in settings_history where effective_to IS NULL
export const settings = pgTable("settings", {
  key: varchar("key", { length: 100 }).primaryKey(), // e.g., "close_time", "fine_amount_unclosed"
  description: text("description").notNull(), // Human-readable description
  unit: varchar("unit", { length: 50 }), // e.g., "Rs", "HH:mm", null
  valueType: varchar("value_type", { length: 50 }).notNull(), // "number", "time", "string", "boolean"
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

// Transactions Table
export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: transactionTypeEnum("type").notNull(),
  description: text("description"),
  createdBy: uuid("created_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


// Settings History Table (Versioned settings values)
// Uses effective_from and effective_to for date ranges
// effective_to IS NULL means this is the currently active setting
// value is stored as JSONB to support different value types
export const settingsHistory = pgTable("settings_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  settingKey: varchar("setting_key", { length: 100 })
    .references(() => settings.key, { onDelete: "cascade" })
    .notNull(),
  value: jsonb("value").notNull(), // Stored as JSONB to support number, string, time, boolean
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"), // NULL means currently active
  createdBy: uuid("created_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Status History Table
export const userStatusHistory = pgTable("user_status_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  status: userStatusEnum("status").notNull(),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
  changedBy: uuid("changed_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Icons Table - Stores icon names used throughout the application
export const icons = pgTable("icons", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  iconName: varchar("icon_name", { length: 100 }).notNull(), // Lucide icon name
  category: varchar("category", { length: 50 }), // e.g., "notification", "menu", "action"
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Notification Preferences Table
export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  notificationType: varchar("notification_type", { length: 100 }).notNull().unique(),
  description: text("description").notNull(),
  recipientType: varchar("recipient_type", { length: 20 }).default("all").notNull(), // "all", "user", "admin", "super_admin"
  iconId: uuid("icon_id").references(() => icons.id, { onDelete: "set null" }),
  enabled: boolean("enabled").default(true).notNull(),
  sendEmail: boolean("send_email").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
