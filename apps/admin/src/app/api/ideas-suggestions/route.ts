import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Fetch all ideas
export async function GET() {
  try {
    console.log('📥 Fetching ideas from database...');
    const { data: ideas, error } = await supabase
      .from('ideas_suggestions')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching ideas:', error);
      throw error;
    }

    console.log('✅ Fetched ideas:', ideas?.length || 0);
    return NextResponse.json({ ideas: ideas || [] });
  } catch (error: any) {
    console.error('GET ideas error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ideas' },
      { status: 500 }
    );
  }
}

// POST - Create new idea
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, category, priority, status } = body;

    console.log('📝 Creating new idea:', { title, category, priority, status });

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const { data: idea, error } = await supabase
      .from('ideas_suggestions')
      .insert({
        title,
        description,
        category: category || 'feature',
        priority: priority || 'medium',
        status: status || 'idea',
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating idea:', error);
      throw error;
    }

    console.log('✅ Created idea:', idea.id);
    return NextResponse.json({ idea });
  } catch (error: any) {
    console.error('POST idea error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create idea' },
      { status: 500 }
    );
  }
}
