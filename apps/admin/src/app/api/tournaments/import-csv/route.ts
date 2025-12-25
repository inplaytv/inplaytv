import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TournamentCSVRow {
  name: string;
  slug: string;
  description?: string;
  location?: string;
  timezone?: string;
  start_date: string;
  end_date: string;
  registration_opens_at: string;
  registration_closes_at: string;
  status?: string;
  image_url?: string;
  external_id?: string;
}

export async function POST(request: Request) {
  try {
    const { tournaments }: { tournaments: TournamentCSVRow[] } = await request.json();

    if (!tournaments || !Array.isArray(tournaments) || tournaments.length === 0) {
      return NextResponse.json(
        { error: 'No tournaments data provided' },
        { status: 400 }
      );
    }

    console.log(`Processing ${tournaments.length} tournaments from CSV`);

    // Validate required fields
    const errors: string[] = [];
    tournaments.forEach((tournament, index) => {
      if (!tournament.name?.trim()) {
        errors.push(`Row ${index + 1}: Missing tournament name`);
      }
      if (!tournament.slug?.trim()) {
        errors.push(`Row ${index + 1}: Missing slug`);
      }
      if (!tournament.start_date) {
        errors.push(`Row ${index + 1}: Missing start_date`);
      }
      if (!tournament.end_date) {
        errors.push(`Row ${index + 1}: Missing end_date`);
      }
      if (!tournament.registration_opens_at) {
        errors.push(`Row ${index + 1}: Missing registration_opens_at`);
      }
      if (!tournament.registration_closes_at) {
        errors.push(`Row ${index + 1}: Missing registration_closes_at`);
      }
    });

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation errors', details: errors },
        { status: 400 }
      );
    }

    // Transform data for database insertion
    const tournamentData = tournaments.map((tournament) => ({
      name: tournament.name.trim(),
      slug: tournament.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      description: tournament.description?.trim() || null,
      location: tournament.location?.trim() || null,
      timezone: tournament.timezone?.trim() || 'Europe/London',
      start_date: tournament.start_date,
      end_date: tournament.end_date,
      registration_opens_at: tournament.registration_opens_at,
      registration_closes_at: tournament.registration_closes_at,
      status: tournament.status || 'upcoming',
      image_url: tournament.image_url?.trim() || null,
      external_id: tournament.external_id?.trim() || null,
    }));

    // Insert tournaments in batch
    const { data: inserted, error: insertError } = await supabase
      .from('tournaments')
      .insert(tournamentData)
      .select();

    if (insertError) {
      console.error('Error inserting tournaments:', insertError);
      
      // Check for duplicate slug error
      if (insertError.code === '23505') {
        return NextResponse.json(
          { 
            error: 'Duplicate tournament slug detected',
            details: 'One or more tournament slugs already exist. Please use unique slugs.',
            dbError: insertError.message 
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Failed to import tournaments',
          details: insertError.message 
        },
        { status: 500 }
      );
    }

    console.log(`Successfully imported ${inserted?.length || 0} tournaments`);

    // Run automatic status update after import
    await supabase.rpc('update_tournament_status');

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${inserted?.length || 0} tournament(s)`,
      imported: inserted?.length || 0,
      tournaments: inserted || [],
    });
  } catch (error: any) {
    console.error('Error in tournament CSV import:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
