import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Fetch all dev notes
export async function GET() {
  try {
    const { data: notes, error } = await supabase
      .from('dev_notes')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ notes: notes || [] });
  } catch (error: any) {
    console.error('GET dev notes error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dev notes' },
      { status: 500 }
    );
  }
}

// POST - Create new dev note
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, category, priority, status } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const { data: note, error } = await supabase
      .from('dev_notes')
      .insert({
        title,
        description,
        category: category || 'general',
        priority: priority || 'medium',
        status: status || 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ note });
  } catch (error: any) {
    console.error('POST dev note error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create dev note' },
      { status: 500 }
    );
  }
}
