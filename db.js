import dotenv from "dotenv"
import pg from "pg";
dotenv.config()


const db = new pg.Client({
    user: process.env.DB_USER,
    host: "localhost",
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: 5432,
  });
db.connect();
export {db} 