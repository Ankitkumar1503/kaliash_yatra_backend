import mysql from "mysql2/promise"
import dotenv from "dotenv"

dotenv.config()

const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
})

await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``
)

await connection.end();

const db =  mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
})

console.log(`Database is connected with: ${process.env.DB_NAME}`)

export default db; 