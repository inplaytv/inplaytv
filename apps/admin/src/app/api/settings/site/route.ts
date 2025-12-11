import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';

export const dynamic = 'force-dynamic';

/**
 * Get site settings
 */
export async function GET(request: NextRequest) {
  try {
    const adminClient = createAdminClient();

    // Get maintenance mode setting
    const { data, error } = await adminClient
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', 'maintenance_mode')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return NextResponse.json({
      maintenance_mode: data?.setting_value || 'live',
    });
  } catch (error: any) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * Update site settings
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { maintenance_mode } = body;

    if (!['live', 'coming-soon', 'maintenance'].includes(maintenance_mode)) {
      return NextResponse.json(
        { error: 'Invalid maintenance mode' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Update or insert setting
    const { error } = await adminClient
      .from('site_settings')
      .upsert({
        setting_key: 'maintenance_mode',
        setting_value: maintenance_mode,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'setting_key'
      });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      maintenance_mode,
    });
  } catch (error: any) {
    console.error('Error updating site settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
