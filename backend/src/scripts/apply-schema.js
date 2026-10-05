import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../db.js";

const currentDir = path.dirname(
  fileURLToPath(import.meta.url),
);

const schemaPath = path.resolve(
  currentDir,
  "../../sql/001_schema.sql",
);

const applySchema = async () => {
  const sql = fs.readFileSync(schemaPath, "utf8");

  await pool.query(sql);
  console.log("Esquema aplicado:", schemaPath);
  await pool.end();
};

applySchema().catch((error) => {
  console.error("No se pudo aplicar el esquema:", error);
  process.exit(1);
});
