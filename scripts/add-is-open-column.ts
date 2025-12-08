import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function addIsOpenColumn() {
  const sql = postgres(DATABASE_URL);

  try {
    console.log("Adding is_open column to attendance table...");

    // Add is_open column with default value of true
    await sql.unsafe(`
      ALTER TABLE "attendance"
      ADD COLUMN IF NOT EXISTS "is_open" boolean DEFAULT true NOT NULL;
    `);

    console.log("✅ is_open column added successfully!");

    // Verify
    const result = await sql`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'attendance' AND column_name = 'is_open';
    `;

    console.log("\nis_open column in attendance table:");
    console.table(result);

    await sql.end();
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    await sql.end();
    process.exit(1);
  }
}

addIsOpenColumn();
