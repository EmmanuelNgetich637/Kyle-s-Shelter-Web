import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { pool } from "../src/config/db.js";

dotenv.config();

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be configured.");
  }

  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters long.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await pool.query(
    `INSERT INTO admin_users (email, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (email)
     DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       updated_at = NOW()
     RETURNING id, email`,
    [email, passwordHash]
  );

  console.log(`Admin account ready for: ${result.rows[0].email}`);
}

seedAdmin()
  .catch((error) => {
    console.error("Admin seeding failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
