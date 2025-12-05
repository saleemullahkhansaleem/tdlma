ALTER TYPE "public"."user_role" ADD VALUE 'super_admin';--> statement-breakpoint
ALTER TABLE "attendance" ALTER COLUMN "status" DROP NOT NULL;