// back/db.js
import pg from 'pg';
const { Pool } = pg;

let _pool = null;

export function getPool() {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      // Agregamos settings para bancar mejor el Wi-Fi inestable
      connectionTimeoutMillis: 10000, 
      idleTimeoutMillis: 30000,
    });

    _pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  return _pool;
}