import "dotenv/config";
import { Pool } from "pg";
import logger from "../utils/logger.js";

const required = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
    throw new Error(
        `Missing required database configuration: ${missing.join(", ")}`,
    );
}

const sslEnabled = process.env.DB_SSL === "true";

const sslConfig = sslEnabled ?
    {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
        ...(process.env.DB_SSL_CA ?
            { ca: process.env.DB_SSL_CA.replace(/\\n/g, "\n") } :
            {}),
    } :
    undefined;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
    connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 5000),
    ...(sslConfig ? { ssl: sslConfig } : {}),
});

pool.on("error", (error) => {
    logger.error("Unexpected idle PostgreSQL client error", { code: error.code });
});

export default pool;