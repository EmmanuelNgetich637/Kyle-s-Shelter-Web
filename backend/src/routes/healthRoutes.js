import { Router } from "express";
import { pool } from "../config/db.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      success: true,
      message: "Shelter Sales API is running.",
      database: "connected",
    });
  } catch (error) {
    next(error);
  }
});

export default router;