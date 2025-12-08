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

async function checkTable() {
  const sql = postgres(DATABASE_URL);

  try {
    // Check what columns exist in the settings table
    const result = await sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'settings'
      ORDER BY ordinal_position;
    `;

    console.log("Current columns in settings table:");
    console.table(result);

    // Check if close_time exists
    const hasCloseTime = result.some(
      (r: any) => r.column_name === "close_time"
    );
    console.log(`\nclose_time column exists: ${hasCloseTime}`);

    if (!hasCloseTime) {
      console.log("\n⚠️  close_time column is missing. Applying migration...");

      const migrationSQL = readFileSync(
        join(process.cwd(), "drizzle/0003_update_settings.sql"),
        "utf-8"
      );

      const statements = migrationSQL
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"));

      for (const statement of statements) {
        if (statement) {
          console.log(`Executing: ${statement.substring(0, 70)}...`);
          try {
            await sql.unsafe(statement);
            console.log("✅ Success");
          } catch (err: any) {
            if (
              err.message?.includes("already exists") ||
              err.message?.includes("does not exist")
            ) {
              console.log("⚠️  Skipped (already exists or doesn't exist)");
            } else {
              console.error(`❌ Error: ${err.message}`);
            }
          }
        }
      }

      // Verify again
      const result2 = await sql`
        SELECT column_name, data_type, column_default
        FROM information_schema.columns
        WHERE table_name = 'settings'
        ORDER BY ordinal_position;
      `;

      console.log("\nColumns after migration:");
      console.table(result2);
    }

    await sql.end();
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    await sql.end();
    process.exit(1);
  }
}

checkTable();
