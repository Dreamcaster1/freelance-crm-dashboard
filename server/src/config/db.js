import mysql from 'mysql2'
import mysqlPromise from 'mysql2/promise'

export const dbOptions = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
}

const pool = mysqlPromise.createPool(dbOptions)

export const sessionPool = mysql.createPool(dbOptions)

export default pool
