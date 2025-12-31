import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';

export const dynamic = 'force-dynamic';

// GET - Fetch all templates
// Note: No auth check needed - entire admin app is already protected by page-level auth
export async function GET(request: NextRequest) {
  try {
    console.log('[Templates API] GET request received');
    
    const adminClient = createAdminClient();
    console.log('[Templates API] Querying database...');
    
    const { data, error } = await adminClient
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('[Templates API] Query result:', { count: data?.length, error: error?.message });

    if (error) {
      console.error('[Templates API] Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[Templates API] Returning', data?.length, 'templates');
    return NextResponse.json({ templates: data || [] });
  } catch (error: any) {
    console.error('[Templates API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new template
// Note: No auth check needed - entire admin app is already protected by page-level auth
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, subject, content, variables, is_active } = body;

    // Validation
    if (!name || !category || !subject || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, subject, content' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    
    const { data, error } = await adminClient
      .from('email_templates')
      .insert([{
        name,
        category,
        subject,
        content,
        variables: variables || [],
        is_active: is_active !== undefined ? is_active : true,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ template: data }, { status: 201 });
  } catch (error: any) {
    console.error('POST template error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
