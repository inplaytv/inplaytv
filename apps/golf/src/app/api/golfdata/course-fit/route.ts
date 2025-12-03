import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const playerId = searchParams.get('playerId');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // If courseId provided, get top players for that course
    if (courseId) {
      const { data, error } = await supabase
        .from('player_course_fit_scores')
        .select('*')
        .eq('course_id', courseId)
        .order('fit_score', { ascending: false })
        .limit(20);

      if (error) throw error;

      return NextResponse.json({ players: data || [] });
    }

    // If playerId provided, get best courses for that player
    if (playerId) {
      const { data, error } = await supabase
        .from('player_course_fit_scores')
        .select('*')
        .eq('golfer_id', playerId)
        .order('fit_score', { ascending: false });

      if (error) throw error;

      return NextResponse.json({ courses: data || [] });
    }

    // Otherwise, get all courses
    const { data: courses, error: coursesError } = await supabase
      .from('course_profiles')
      .select('*')
      .order('name');

    if (coursesError) throw coursesError;

    return NextResponse.json({ courses: courses || [] });
  } catch (error: any) {
    console.error('Course fit API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course fit data', details: error.message },
      { status: 500 }
    );
  }
}
