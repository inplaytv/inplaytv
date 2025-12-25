import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { createClient } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication using cookies
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminClient = createAdminClient();
    const { data: adminCheck } = await adminClient
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const formData = await request.formData();
    const adType = formData.get('ad_type') as string;

    if (adType === 'tournament_featured') {
      // Update tournament featured card ad
      const updateData = {
        tournament_featured_partner_label: formData.get('partner_label'),
        tournament_featured_company_name: formData.get('company_name'),
        tournament_featured_tagline: formData.get('tagline'),
        tournament_featured_cta_text: formData.get('cta_text'),
        tournament_featured_link_url: formData.get('link_url'),
        updated_at: new Date().toISOString(),
      };

      const { error } = await adminClient
        .from('advertisement_settings')
        .upsert(updateData);

      if (error) {
        console.error('Error updating tournament ad:', error);
        return NextResponse.json({ error: 'Failed to update advertisement' }, { status: 500 });
      }
    } else if (adType === 'scorecard_confirmation') {
      // Update all three scorecard confirmation ads
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      for (let i = 1; i <= 3; i++) {
        updateData[`scorecard_ad${i}_company_name`] = formData.get(`slot${i}_company_name`);
        updateData[`scorecard_ad${i}_tagline`] = formData.get(`slot${i}_tagline`);
        updateData[`scorecard_ad${i}_image_url`] = formData.get(`slot${i}_image_url`) || null;
        updateData[`scorecard_ad${i}_link_url`] = formData.get(`slot${i}_link_url`) || null;
      }

      const { error } = await adminClient
        .from('advertisement_settings')
        .upsert(updateData);

      if (error) {
        console.error('Error updating scorecard ads:', error);
        return NextResponse.json({ error: 'Failed to update advertisements' }, { status: 500 });
      }
    }

    return NextResponse.redirect(new URL('/advertisements?success=true', request.url));
  } catch (error) {
    console.error('Error in advertisements API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const adminClient = createAdminClient();
    
    const { data, error } = await adminClient
      .from('advertisement_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    return NextResponse.json(data || {});
  } catch (error) {
    console.error('Error fetching advertisements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
