import { NextResponse } from 'next/server';
import seedPollingStations from '@/lib/data/seed-polling-stations.json';
import { getDbPool } from '@/lib/db';
import { PollingStation } from '@/lib/types';

export async function GET() {
  const pool = getDbPool();

  if (pool) {
    try {
      const result = await pool.query(
        'SELECT * FROM polling_stations ORDER BY part_no ASC;'
      );
      return NextResponse.json({
        total: result.rows.length,
        booths: result.rows as PollingStation[],
        source: 'supabase_postgres',
      });
    } catch (err) {
      console.warn('Postgres query for polling stations failed, using fallback:', err);
    }
  }

  return NextResponse.json({
    total: seedPollingStations.length,
    booths: seedPollingStations as unknown as PollingStation[],
    source: 'local_seed',
  });
}
