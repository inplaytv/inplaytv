import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createAdminClient();

    // Fetch all wallets (bypasses RLS)
    const { data: wallets, error } = await supabaseAdmin
      .from('clubhouse_wallets')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching wallets:', error);
      return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 });
    }

    // Return with no-cache headers
    return new NextResponse(JSON.stringify({ wallets: wallets || [] }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error: any) {
    console.error('Error in wallets API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
