import { createPool } from "mysql2/promise";
import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";

export type { PoolConnection };

export type QueryParam =
  | string
  | number
  | bigint
  | boolean
  | Date
  | Buffer
  | null
  | undefined;

const pool: Pool = createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
});

// If MySQL is unreachable the pool emits an 'error' event. Swallow it here so
// queries reject to the caller (and callers fall back to defaults) instead of
// crashing the process. The promise Pool type omits the 'error' overload, so
// call through a minimal EventEmitter-shaped cast.
(
  pool as unknown as {
    on(event: "error", listener: (err: Error) => void): unknown;
  }
).on("error", () => {});

export async function query<T = RowDataPacket>(
  sql: string,
  params: QueryParam[] = [],
): Promise<T[]> {
  const [rows] = await pool.query<RowDataPacket[]>(sql, params);
  return rows as unknown as T[];
}

export async function withTransaction<T>(
  fn: (conn: PoolConnection) => Promise<T>,
): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export { pool };