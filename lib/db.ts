import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./db/schema";

neonConfig.fetchConnectionCache = true;

// Lazy database initialization
// Only initialize when actually accessed, not during module evaluation
let _db: ReturnType<typeof drizzle> | null = null;
let _initializing = false;

function initializeDb() {
  if (_db) return _db;
  if (_initializing) {
    // Prevent re-initialization during async operations
    throw new Error("Database is being initialized");
  }

  _initializing = true;
  try {
    // Try to load .env.local in development
    if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "production") {
      try {
        const dotenv = require("dotenv");
        const { resolve } = require("path");
        dotenv.config({ path: resolve(process.cwd(), ".env.local") });
      } catch {
        // Ignore if dotenv fails
      }
    }

    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL environment variable is not set. Please set it in your Vercel environment variables."
      );
    }

    const sql = neon(process.env.DATABASE_URL);
    _db = drizzle(sql, { schema });
    return _db;
  } finally {
    _initializing = false;
  }
}

// Create a proxy that initializes on first access
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const dbInstance = initializeDb();
    const value = dbInstance[prop as keyof typeof dbInstance];
    if (typeof value === "function") {
      return value.bind(dbInstance);
    }
    return value;
  },
});

export * from "./db/schema";
