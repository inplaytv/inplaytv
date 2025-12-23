import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { assertAdminOrRedirect } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// PUT - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const { id } = params;
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
      .update({
        name,
        category,
        subject,
        content,
        variables: variables || [],
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating template:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ template: data });
  } catch (error: any) {
    console.error('PUT template error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const { id } = params;

    const adminClient = createAdminClient();
    
    const { error } = await adminClient
      .from('email_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting template:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE template error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
