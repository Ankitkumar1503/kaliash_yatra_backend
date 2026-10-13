import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

console.time("connect");
const result = await pool.query("SELECT NOW()");
console.timeEnd("connect");
console.log(result.rows[0]);

await pool.end();