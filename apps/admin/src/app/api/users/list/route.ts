import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';

export async function GET(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    
    // Get all auth users
    const { data: { users }, error } = await adminClient.auth.admin.listUsers();
    
    if (error) {
      throw error;
    }

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error fetching users list:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
