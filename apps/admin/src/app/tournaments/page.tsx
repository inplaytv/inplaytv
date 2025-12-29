import { assertAdminOrRedirect } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import Link from 'next/link';
import TournamentsList from './TournamentsList';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching - always fetch fresh data

interface Tournament {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  status: string;
  start_date: string;
  end_date: string;
  updated_at: string;
  is_visible: boolean;
  image_url: string | null;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  round_1_start: string | null;
  round_2_start: string | null;
  round_3_start: string | null;
  round_4_start: string | null;
  competition_count?: number;
}

async function getTournaments(): Promise<Tournament[]> {
  try {
    const adminClient = createAdminClient();
    
    const { data, error } = await adminClient
      .from('tournaments')
      .select(`
        id, 
        name, 
        slug, 
        location, 
        status, 
        start_date, 
        end_date, 
        updated_at, 
        is_visible,
        image_url,
        registration_opens_at,
        registration_closes_at,
        round_1_start,
        round_2_start,
        round_3_start,
        round_4_start
      `)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching tournaments:', error);
      return [];
    }

    // Fetch competition counts separately
    const tournamentsWithCounts = await Promise.all(
      (data || []).map(async (t: any) => {
        try {
          const { count } = await adminClient
            .from('tournament_competitions')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', t.id)
            .eq('competition_format', 'inplay');
          
          return {
            ...t,
            competition_count: count || 0,
          };
        } catch (err) {
          console.error(`Error fetching competition count for ${t.id}:`, err);
          return {
            ...t,
            competition_count: 0,
          };
        }
      })
    );

    return tournamentsWithCounts;
  } catch (err) {
    console.error('Error in getTournaments:', err);
    return [];
  }
}

export default async function TournamentsPage() {
  try {
    await assertAdminOrRedirect();
  } catch (err) {
    console.error('Auth error:', err);
    return <div>Authentication error</div>;
  }
  
  const tournaments = await getTournaments();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Tournaments</h1>
        <Link
          href="/tournaments/new"
          style={{
            padding: '0.625rem 1.25rem',
            background: 'rgba(59, 130, 246, 0.9)',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Create Tournament
        </Link>
      </div>

      <TournamentsList initialTournaments={tournaments} />
    </div>
  );
}
