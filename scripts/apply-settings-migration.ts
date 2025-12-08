import { config } from "dotenv";
import postgres from "postgres";
import { readFileSync } from "fs";
import { join } from "path";

config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function applyMigration() {
  const sql = postgres(DATABASE_URL);

  const migrationSQL = readFileSync(
    join(process.cwd(), "drizzle/0003_update_settings.sql"),
    "utf-8"
  );

  console.log("Applying settings migration...");

  try {
    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const statement of statements) {
      if (statement) {
        console.log(`Executing: ${statement.substring(0, 60)}...`);
        await sql.unsafe(statement);
      }
    }

    console.log("✅ Migration applied successfully!");
    await sql.end();
  } catch (error: any) {
    // If column already exists, that's okay
    if (
      error.message?.includes("already exists") ||
      error.message?.includes("duplicate") ||
      error.message?.includes("does not exist")
    ) {
      console.log(
        "⚠️  Some operations may have been skipped (columns may already exist or not exist), continuing..."
      );
    } else {
      console.error("❌ Error applying migration:", error.message);
      await sql.end();
      process.exit(1);
    }
  }
}

applyMigration();
