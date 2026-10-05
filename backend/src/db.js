import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
const useNeonSsl = connectionString?.includes("neon.tech");

export const pool = new Pool({
  connectionString,
  ssl: useNeonSsl
    ? { rejectUnauthorized: false }
    : undefined,
});

pool.on("connect", () => {
  console.log("PostgreSQL conectado");
});