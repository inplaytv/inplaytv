import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { assertAdminOrRedirect } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - List all golfer groups
export async function GET() {
  try {
    await assertAdminOrRedirect();
    
    const adminClient = createAdminClient();
    
    // Get groups with member counts
    const { data, error } = await adminClient
      .from('golfer_groups')
      .select(`
        *,
        golfer_group_members (count)
      `)
      .order('name', { ascending: true });

    if (error) throw error;

    // Transform to include member count
    const groupsWithCounts = (data || []).map(group => ({
      ...group,
      member_count: group.golfer_group_members?.[0]?.count || 0,
      golfer_group_members: undefined, // Remove the nested object
    }));

    return NextResponse.json(groupsWithCounts);
  } catch (error: any) {
    console.error('GET golfer groups error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new golfer group
export async function POST(request: NextRequest) {
  try {
    await assertAdminOrRedirect();
    
    const body = await request.json();
    const { name, slug, description, color } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('golfer_groups')
      .insert({
        name,
        slug,
        description: description || null,
        color: color || '#3b82f6',
      })
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation on slug
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A group with this slug already exists' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('POST golfer group error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
