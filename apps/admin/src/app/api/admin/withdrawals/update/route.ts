import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin
    const userIsAdmin = await isAdmin(user.id);
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    // Parse form data
    const formData = await request.formData();
    const request_id = parseInt(formData.get('request_id') as string);
    const action = formData.get('action') as string;
    const note = formData.get('note') as string | null;
    
    if (!request_id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Map action to status
    const statusMap: Record<string, string> = {
      'approved': 'approved',
      'rejected': 'rejected',
      'paid': 'paid',
      'cancelled': 'cancelled',
    };
    
    const new_status = statusMap[action];
    if (!new_status) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    // Call admin function to update status
    const adminClient = createAdminClient();
    const { error: rpcError } = await adminClient.rpc('admin_withdrawal_set_status', {
      p_request_id: request_id,
      p_new_status: new_status,
      p_note: note,
    });
    
    if (rpcError) {
      console.error('RPC error:', rpcError);
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }
    
    // Redirect back to withdrawals page
    return NextResponse.redirect(new URL('/withdrawals', request.url));
  } catch (error: any) {
    console.error('Withdrawal update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update withdrawal' },
      { status: 500 }
    );
  }
}
