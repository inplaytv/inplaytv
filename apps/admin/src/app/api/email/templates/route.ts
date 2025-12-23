import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { assertAdminOrRedirect } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Fetch all templates
export async function GET(request: NextRequest) {
  try {
    await assertAdminOrRedirect();
    
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ templates: data || [] });
  } catch (error: any) {
    console.error('GET templates error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new template
export async function POST(request: NextRequest) {
  try {
    await assertAdminOrRedirect();
    
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
