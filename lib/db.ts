import { Pool, QueryResultRow } from 'pg';

const connectionString = process.env.DATABASE_URL?.replace('sslmode=require', 'sslmode=no-verify');

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

pool.on('connect', (client) => {
  client.query("SET search_path TO bd_mov_materiales, public");
});

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const { rows } = await pool.query<T>(text, params);
  return rows;
}

export async function queryOne<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export { pool };
