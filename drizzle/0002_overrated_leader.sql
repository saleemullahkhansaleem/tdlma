CREATE TYPE "public"."user_status" AS ENUM('Active', 'Inactive');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" "user_status" DEFAULT 'Active' NOT NULL;