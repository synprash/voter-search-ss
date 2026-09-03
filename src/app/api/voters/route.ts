import { NextRequest, NextResponse } from 'next/server';
import seedVoters from '@/lib/data/seed-voters.json';
import { getDbPool } from '@/lib/db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Voter } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  const partNo = searchParams.get('partNo');
  const gender = searchParams.get('gender');
  const ageBracket = searchParams.get('ageBracket');
  const familyId = searchParams.get('familyId');

  const pool = getDbPool();

  // 1. Direct PostgreSQL query via connection pool if configured
  if (pool) {
    try {
      const conditions: string[] = [];
      const values: (string | number)[] = [];
      let paramIdx = 1;

      if (partNo && partNo !== 'all') {
        conditions.push(`part_no = $${paramIdx++}`);
        values.push(Number(partNo));
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
        values.push(`%${q}%`);
        paramIdx++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const sqlQuery = `SELECT * FROM voters ${whereClause} ORDER BY part_no ASC, serial_no ASC LIMIT 2000;`;

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
      if (partNo && partNo !== 'all') {
        queryBuilder = queryBuilder.eq('part_no', Number(partNo));
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
    if (partNo && partNo !== 'all' && v.part_no !== Number(partNo)) return false;
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
      const hay = [
        v.voter_name_en,
        v.voter_name_mr,
        v.relative_name_en,
        v.relative_name_mr,
        v.epic_no,
        v.address_en,
        v.address_mr,
        v.house_no,
        String(v.serial_no),
        String(v.family_id),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(queryLower)) return false;
    }
    return true;
  });

  return NextResponse.json({
    total: filtered.length,
    voters: filtered,
    source: 'local_seed',
  });
}
