import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function addCloseTimeColumn() {
  const sql = postgres(DATABASE_URL);

  try {
    console.log("Adding close_time column to settings table...");

    // Add close_time column
    await sql.unsafe(`
      ALTER TABLE "settings"
      ADD COLUMN IF NOT EXISTS "close_time" varchar(5) DEFAULT '18:00' NOT NULL;
    `);

    console.log("✅ close_time column added successfully!");

    // Drop user_id column if it exists
    await sql.unsafe(`
      ALTER TABLE "settings" DROP COLUMN IF EXISTS "user_id";
    `);

    console.log("✅ user_id column removed (if it existed)");

    // Verify
    const result = await sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'settings'
      ORDER BY ordinal_position;
    `;

    console.log("\nFinal columns in settings table:");
    console.table(result);

    await sql.end();
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    await sql.end();
    process.exit(1);
  }
}

addCloseTimeColumn();
