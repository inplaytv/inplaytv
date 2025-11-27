import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// PATCH - Update idea
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, description, category, priority, status, is_approved } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (is_approved !== undefined) {
      updateData.is_approved = is_approved;
      if (is_approved && status === 'idea') {
        updateData.status = 'approved';
      }
    }

    const { data: idea, error } = await supabase
      .from('ideas_suggestions')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ idea });
  } catch (error: any) {
    console.error('PATCH idea error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update idea' },
      { status: 500 }
    );
  }
}

// DELETE - Delete idea
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('ideas_suggestions')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE idea error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete idea' },
      { status: 500 }
    );
  }
}
