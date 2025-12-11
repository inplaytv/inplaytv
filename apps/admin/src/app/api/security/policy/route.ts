import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';

export const dynamic = 'force-dynamic';

/**
 * Get global security policies
 */
export async function GET(request: NextRequest) {
  try {
    const adminClient = createAdminClient();

    // Get default security policy (use service role to bypass RLS)
    const { data: policy, error: policyError } = await adminClient
      .from('admin_security_policies')
      .select('*')
      .eq('policy_name', 'default')
      .single();

    if (policyError) {
      console.error('Error fetching security policy:', policyError);
      console.error('Policy error details:', JSON.stringify(policyError, null, 2));
      return NextResponse.json({ 
        error: 'Failed to fetch security policy',
        details: policyError.message 
      }, { status: 500 });
    }

    if (!policy) {
      console.error('No policy found with name "default"');
      return NextResponse.json({ 
        error: 'Security policy not found. Run setup-user-security-mfa.sql in Supabase.' 
      }, { status: 404 });
    }

    return NextResponse.json(policy);

  } catch (error) {
    console.error('Get security policy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update global security policies
 */
export async function PUT(request: NextRequest) {
  try {
    const updates = await request.json();
    const adminClient = createAdminClient();

    // Update security policy (use service role to bypass RLS)
    const { data: updatedPolicy, error: updateError } = await adminClient
      .from('admin_security_policies')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('policy_name', 'default')
      .select()
      .single();

    if (updateError) {
      console.error('Error updating security policy:', updateError);
      return NextResponse.json({ error: 'Failed to update security policy' }, { status: 500 });
    }

    return NextResponse.json(updatedPolicy);

  } catch (error) {
    console.error('Update security policy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
