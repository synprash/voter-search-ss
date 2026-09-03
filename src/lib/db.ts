import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;

let poolInstance: Pool | null = null;

export function getDbPool(): Pool | null {
  if (!databaseUrl) return null;
  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    });
  }
  return poolInstance;
}

export const isDatabaseConfigured = Boolean(databaseUrl);
