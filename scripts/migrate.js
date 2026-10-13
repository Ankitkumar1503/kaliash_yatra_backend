import "dotenv/config";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import pool from "../src/config/db.js";
import logger from "../src/utils/logger.js";

const directory = fileURLToPath(new URL("../db/migrations/", import.meta.url));
const lockId = "7438291052026";

export const runMigrations = async () => {
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock($1::bigint)", [lockId]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        name VARCHAR(255) PRIMARY KEY,
        checksum CHAR(64) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const files = (await readdir(directory))
      .filter((name) => /^\d+_[a-z0-9_-]+\.sql$/i.test(name))
      .sort();

    if (files.length === 0) throw new Error("No migration files found");

    for (const name of files) {
      const sql = await readFile(join(directory, name), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const { rows } = await client.query(
        "SELECT checksum FROM public.schema_migrations WHERE name = $1",
        [name],
      );

      if (rows.length) {
        if (rows[0].checksum.trim() !== checksum) {
          throw new Error(`Applied migration checksum changed: ${name}`);
        }
        logger.info("Migration already applied", { name });
        continue;
      }

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO public.schema_migrations (name, checksum) VALUES ($1, $2)",
          [name, checksum],
        );
        await client.query("COMMIT");
        logger.info("Migration applied", { name });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock($1::bigint)", [lockId]).catch(() => {});
    client.release();
  }
};

if (process.argv[1] && basename(process.argv[1]) === "migrate.js") {
  try {
    await runMigrations();
  } catch (error) {
    logger.error("Database migration failed", { message: error.message, code: error.code });
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
