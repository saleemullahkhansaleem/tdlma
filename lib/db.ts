import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./db/schema";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load .env.local file if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: resolve(process.cwd(), ".env.local") });
}

neonConfig.fetchConnectionCache = true;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

export * from "./db/schema";
