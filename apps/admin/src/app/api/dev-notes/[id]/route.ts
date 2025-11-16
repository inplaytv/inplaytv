import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// PATCH - Update dev note
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updates: any = {};

    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.category !== undefined) updates.category = body.category;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.status !== undefined) updates.status = body.status;
    if (body.is_completed !== undefined) {
      updates.is_completed = body.is_completed;
      if (body.is_completed) {
        updates.completed_at = new Date().toISOString();
        updates.status = 'completed';
      } else {
        updates.completed_at = null;
      }
    }

    updates.updated_at = new Date().toISOString();

    const { data: note, error } = await supabase
      .from('dev_notes')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ note });
  } catch (error: any) {
    console.error('PATCH dev note error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update dev note' },
      { status: 500 }
    );
  }
}

// DELETE - Delete dev note
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('dev_notes')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE dev note error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete dev note' },
      { status: 500 }
    );
  }
}
