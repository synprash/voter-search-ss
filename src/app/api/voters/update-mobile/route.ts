import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/auth';
import { getDbPool } from '@/lib/db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  // 1. Verify Admin session
  const session = getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin authentication required' },
      { status: 401 }
    );
  }

  try {
    const { voterId, mobileNo } = await req.json();

    if (!voterId) {
      return NextResponse.json(
        { error: 'voterId is required' },
        { status: 400 }
      );
    }

    const cleanMobile = mobileNo ? String(mobileNo).trim() : null;

    // 2. Direct PostgreSQL update via connection pool
    const pool = getDbPool();
    if (pool) {
      const res = await pool.query(
        'UPDATE voters SET mobile_no = $1 WHERE id = $2 RETURNING id, voter_name_en, mobile_no',
        [cleanMobile, voterId]
      );
      if (res.rows.length > 0) {
        return NextResponse.json({
          success: true,
          voter: res.rows[0],
          source: 'postgres',
        });
      }
    }

    // 3. Fallback to Supabase client if configured
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('voters')
        .update({ mobile_no: cleanMobile })
        .eq('id', voterId)
        .select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        voter: data?.[0],
        source: 'supabase',
      });
    }

    // 4. Return success for local mock
    return NextResponse.json({
      success: true,
      voterId,
      mobileNo: cleanMobile,
      source: 'local',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to update mobile number' },
      { status: 500 }
    );
  }
}
