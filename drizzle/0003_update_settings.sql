-- Drop old columns from settings table
ALTER TABLE "settings" DROP COLUMN IF EXISTS "user_id";
ALTER TABLE "settings" DROP COLUMN IF EXISTS "theme";
ALTER TABLE "settings" DROP COLUMN IF EXISTS "notifications";
ALTER TABLE "settings" DROP COLUMN IF EXISTS "language";

-- Add new columns to settings table
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "close_time" varchar(5) DEFAULT '18:00' NOT NULL;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "fine_amount_unclosed" numeric(10, 2) DEFAULT '0' NOT NULL;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "fine_amount_unopened" numeric(10, 2) DEFAULT '0' NOT NULL;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "disabled_dates" json DEFAULT '[]' NOT NULL;
