import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

export const pool = new Pool(
  databaseUrl
    ? {
        connectionString: databaseUrl,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
      }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
      }
);

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});
