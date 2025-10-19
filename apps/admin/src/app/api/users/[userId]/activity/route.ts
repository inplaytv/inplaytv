import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    const adminClient = createAdminClient();

    // Fetch transactions
    const { data: transactions } = await adminClient
      .from('transactions')
      .select('type, amount_cents, created_at, description')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch entries
    const { data: entries } = await adminClient
      .from('entries')
      .select('entry_name, entry_fee, created_at, tournament_id, tournaments(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch withdrawal requests
    const { data: withdrawals } = await adminClient
      .from('withdrawal_requests')
      .select('amount_cents, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Combine and sort by date
    const activity = [
      ...(transactions || []).map(t => ({
        type: 'transaction' as const,
        description: t.description || `${t.type} transaction`,
        amount: t.amount_cents,
        date: t.created_at,
      })),
      ...(entries || []).map(e => ({
        type: 'entry' as const,
        description: `Entered ${(e.tournaments as any)?.name || 'tournament'}`,
        amount: -(e.entry_fee * 100), // Convert to cents and make negative
        date: e.created_at,
      })),
      ...(withdrawals || []).map(w => ({
        type: 'withdrawal' as const,
        description: `Withdrawal ${w.status}`,
        amount: -w.amount_cents,
        date: w.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    return NextResponse.json(activity);
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json([], { status: 200 }); // Return empty array on error
  }
}
