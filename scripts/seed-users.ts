import { db, users } from "../lib/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function seedUsers() {
  try {
    console.log("Seeding users...");

    // Hash passwords
    const adminPassword = await bcrypt.hash("admin123", 10);
    const userPassword = await bcrypt.hash("user123", 10);
    const superAdminPassword = await bcrypt.hash("superadmin123", 10);

    // Check if users already exist
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, "admin@example.com"))
      .limit(1);

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, "user@example.com"))
      .limit(1);

    const existingSuperAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, "superadmin@example.com"))
      .limit(1);

    if (existingAdmin.length === 0) {
      await db.insert(users).values({
        name: "Admin User",
        email: "admin@example.com",
        passwordHash: adminPassword,
        role: "admin",
      });
      console.log("✓ Admin user created (admin@example.com / admin123)");
    } else {
      console.log("⚠ Admin user already exists");
    }

    if (existingUser.length === 0) {
      await db.insert(users).values({
        name: "Regular User",
        email: "user@example.com",
        passwordHash: userPassword,
        role: "user",
      });
      console.log("✓ Regular user created (user@example.com / user123)");
    } else {
      console.log("⚠ Regular user already exists");
    }

    if (existingSuperAdmin.length === 0) {
      await db.insert(users).values({
        name: "Super Admin",
        email: "superadmin@example.com",
        passwordHash: superAdminPassword,
        role: "super_admin",
      });
      console.log(
        "✓ Super admin user created (superadmin@example.com / superadmin123)"
      );
    } else {
      console.log("⚠ Super admin user already exists");
    }

    console.log("Seeding completed!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding users:", error);
    process.exit(1);
  }
}

seedUsers();
