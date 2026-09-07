import { NextRequest, NextResponse } from 'next/server';
import seedVoters from '@/lib/data/seed-voters.json';
import { getDbPool } from '@/lib/db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Voter } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  const rawParts = [
    ...searchParams.getAll('partNo'),
    ...searchParams.getAll('partNos'),
  ];
  const partNos = rawParts
    .flatMap((p) => p.split(','))
    .map((p) => p.trim())
    .filter((p) => p && p !== 'all')
    .map(Number)
    .filter((n) => !isNaN(n) && n > 0);

  const gender = searchParams.get('gender');
  const ageBracket = searchParams.get('ageBracket');
  const familyId = searchParams.get('familyId');

  const pool = getDbPool();

  // 1. Direct PostgreSQL query via connection pool if configured
  if (pool) {
    try {
      const conditions: string[] = [];
      const values: (string | number | number[])[] = [];
      let paramIdx = 1;

      if (partNos.length > 0) {
        conditions.push(`part_no = ANY($${paramIdx++}::int[])`);
        values.push(partNos);
      }

      if (familyId) {
        conditions.push(`family_id = $${paramIdx++}`);
        values.push(Number(familyId));
      }

      if (gender) {
        conditions.push(`(gender_en ILIKE $${paramIdx} OR gender_mr = $${paramIdx})`);
        values.push(gender);
        paramIdx++;
      }

      if (ageBracket) {
        if (ageBracket === '18-25') conditions.push('age >= 18 AND age <= 25');
        else if (ageBracket === '26-40') conditions.push('age >= 26 AND age <= 40');
        else if (ageBracket === '41-60') conditions.push('age >= 41 AND age <= 60');
        else if (ageBracket === '61+') conditions.push('age >= 61');
      }

      if (q) {
        const tokens = q.split(/\s+/).filter(Boolean);
        tokens.forEach((token) => {
          conditions.push(`(
            voter_name_en ILIKE $${paramIdx} OR
            voter_name_mr ILIKE $${paramIdx} OR
            relative_name_en ILIKE $${paramIdx} OR
            relative_name_mr ILIKE $${paramIdx} OR
            epic_no ILIKE $${paramIdx} OR
            mobile_no ILIKE $${paramIdx} OR
            address_en ILIKE $${paramIdx} OR
            address_mr ILIKE $${paramIdx} OR
            house_no ILIKE $${paramIdx} OR
            serial_no::text ILIKE $${paramIdx} OR
            family_id::text ILIKE $${paramIdx}
          )`);
          values.push(`%${token}%`);
          paramIdx++;
        });
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const sqlQuery = `SELECT * FROM voters_view ${whereClause} ORDER BY part_no ASC, serial_no ASC LIMIT 10000;`;

      const result = await pool.query(sqlQuery, values);
      return NextResponse.json({
        total: result.rows.length,
        voters: result.rows as Voter[],
        source: 'supabase_postgres',
      });
    } catch (err) {
      console.warn('Postgres query failed, falling back to local dataset:', err);
    }
  }

  // 2. Fallback to Supabase REST client or in-memory seed dataset
  let voters: Voter[] = seedVoters as Voter[];

  if (isSupabaseConfigured && supabase) {
    try {
      let queryBuilder = supabase.from('voters').select('*');
      if (partNos.length > 0) {
        queryBuilder = queryBuilder.in('part_no', partNos);
      }
      if (familyId) {
        queryBuilder = queryBuilder.eq('family_id', Number(familyId));
      }
      const { data, error } = await queryBuilder;
      if (!error && data && data.length > 0) {
        voters = data as Voter[];
      }
    } catch (err) {
      console.warn('Supabase REST query failed:', err);
    }
  }

  const queryLower = q.toLowerCase();
  const filtered = voters.filter((v) => {
    if (partNos.length > 0 && !partNos.includes(v.part_no)) return false;
    if (familyId && String(v.family_id) !== familyId) return false;
    if (gender) {
      const match =
        v.gender_en.toLowerCase() === gender.toLowerCase() ||
        v.gender_mr === gender;
      if (!match) return false;
    }
    if (ageBracket) {
      const age = v.age;
      if (ageBracket === '18-25' && (age < 18 || age > 25)) return false;
      if (ageBracket === '26-40' && (age < 26 || age > 40)) return false;
      if (ageBracket === '41-60' && (age < 41 || age > 60)) return false;
      if (ageBracket === '61+' && age < 61) return false;
    }
    if (queryLower) {
      const tokens = queryLower.split(/\s+/).filter(Boolean);
      if (tokens.length > 0) {
        const hay = [
          v.voter_name_en,
          v.voter_name_mr,
          v.relative_name_en,
          v.relative_name_mr,
          v.epic_no,
          v.mobile_no,
          v.address_en,
          v.address_mr,
          v.house_no,
          String(v.serial_no),
          String(v.family_id),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        const matchesAll = tokens.every((t) => hay.includes(t));
        if (!matchesAll) return false;
      }
    }
    return true;
  });

  return NextResponse.json({
    total: filtered.length,
    voters: filtered,
    source: 'local_seed',
  });
}
