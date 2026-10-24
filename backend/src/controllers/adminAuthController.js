import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

export async function loginAdmin(req, res, next) {
  try {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password =
      typeof req.body?.password === "string"
        ? req.body.password
        : "";

    if (!email || !password || email.length > 254 || password.length > 1024) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address and password.",
      });
    }

    const result = await pool.query(
      `SELECT id, email, password_hash
       FROM admin_users
       WHERE email = $1
       LIMIT 1`,
      [email]
    );

    const admin = result.rows[0];

    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "Authentication is not configured.",
      });
    }

    const token = jwt.sign(
      {
        role: "admin",
        email: admin.email,
      },
      secret,
      {
        algorithm: "HS256",
        subject: String(admin.id),
        expiresIn: "2h",
      }
    );

    res.set("Cache-Control", "no-store");

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email,
        },
        expiresIn: 7200,
      },
    });
  } catch (error) {
    next(error);
  }
}
