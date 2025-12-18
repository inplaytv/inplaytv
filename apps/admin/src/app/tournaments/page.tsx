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
}

async function getTournaments(): Promise<Tournament[]> {
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from('tournaments')
    .select('id, name, slug, location, status, start_date, end_date, updated_at, is_visible')
    .order('start_date', { ascending: false });

  if (error) {
    console.error('Error fetching tournaments:', error);
    return [];
  }

  return data || [];
}

export default async function TournamentsPage() {
  await assertAdminOrRedirect();
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
