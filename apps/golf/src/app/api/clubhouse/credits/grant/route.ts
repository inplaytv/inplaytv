import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { user_id, credits, reason } = await req.json();
    
    if (!user_id || !credits || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Call the RPC function to grant credits
    const { data, error } = await supabase.rpc('apply_clubhouse_credits', {
      p_user_id: user_id,
      p_amount: credits,
      p_reason: reason,
    });

    if (error) throw error;

    return NextResponse.json({ success: true, new_balance: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
