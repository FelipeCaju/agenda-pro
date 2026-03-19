import mysql from "mysql2/promise";
import { loadEnvironment } from "./env.js";

let pool;

function getPoolConfig() {
  loadEnvironment();

  return {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    database: process.env.DB_NAME ?? "agendapro",
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT ?? 10),
    queueLimit: 0,
    dateStrings: true,
  };
}

export function getDatabaseConfig() {
  loadEnvironment();

  return {
    client: process.env.DB_CLIENT ?? "mysql",
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    database: process.env.DB_NAME ?? "agendapro",
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
  };
}

export function describeDatabaseTarget() {
  const config = getDatabaseConfig();

  return {
    ...config,
    password: config.password ? "***" : "",
  };
}

export async function getPool() {
  if (!pool) {
    pool = mysql.createPool(getPoolConfig());
  }

  return pool;
}

export async function query(sql, params = []) {
  const db = await getPool();
  const [rows] = await db.query(sql, params);
  return rows;
}

export async function execute(sql, params = []) {
  const db = await getPool();
  const [result] = await db.execute(sql, params);
  return result;
}

export async function withTransaction(callback) {
  const db = await getPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function verifyDatabaseConnection() {
  const rows = await query("SELECT 1 AS ok");
  return rows[0]?.ok === 1;
}
