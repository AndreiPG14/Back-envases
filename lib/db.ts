import { Pool, QueryResultRow } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
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
