import { assertAdminOrRedirect } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Tournament {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  status: string;
  start_date: string;
  end_date: string;
  updated_at: string;
}

async function getTournaments(): Promise<Tournament[]> {
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from('tournaments')
    .select('id, name, slug, location, status, start_date, end_date, updated_at')
    .order('start_date', { ascending: false });

  if (error) {
    console.error('Error fetching tournaments:', error);
    return [];
  }

  return data || [];
}

function getStatusBadge(status: string) {
  const styles: Record<string, { bg: string; border: string; color: string }> = {
    draft: { bg: 'rgba(100, 100, 100, 0.2)', border: 'rgba(100, 100, 100, 0.4)', color: '#9ca3af' },
    upcoming: { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.4)', color: '#60a5fa' },
    reg_open: { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.4)', color: '#10b981' },
    reg_closed: { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24' },
    live: { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.4)', color: '#f87171' },
    completed: { bg: 'rgba(139, 92, 246, 0.2)', border: 'rgba(139, 92, 246, 0.4)', color: '#a78bfa' },
    cancelled: { bg: 'rgba(75, 85, 99, 0.2)', border: 'rgba(75, 85, 99, 0.4)', color: '#6b7280' },
  };

  const style = styles[status] || styles.draft;

  return (
    <span style={{
      padding: '0.25rem 0.625rem',
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: 600,
      color: style.color,
      textTransform: 'uppercase',
    }}>
      {status.replace('_', ' ')}
    </span>
  );
}

function formatDate(dateString: string | null) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(dateString: string | null) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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

      <div style={{
        background: 'rgba(30, 30, 35, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Title</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Location</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Status</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Start</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>End</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Updated</th>
              <th style={{ padding: '0.875rem', textAlign: 'right', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tournaments.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
                  No tournaments yet. Create one to get started.
                </td>
              </tr>
            ) : (
              tournaments.map((tournament) => (
                <tr key={tournament.id} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                    {tournament.name}
                  </td>
                  <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                    {tournament.location || '—'}
                  </td>
                  <td style={{ padding: '0.875rem' }}>
                    {getStatusBadge(tournament.status)}
                  </td>
                  <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                    {formatDate(tournament.start_date)}
                  </td>
                  <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                    {formatDate(tournament.end_date)}
                  </td>
                  <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                    {formatDate(tournament.updated_at)}
                  </td>
                  <td style={{ padding: '0.875rem', textAlign: 'right' }}>
                    <Link
                      href={`/tournaments/${tournament.id}`}
                      style={{
                        padding: '0.375rem 0.75rem',
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        borderRadius: '4px',
                        color: '#60a5fa',
                        fontSize: '0.8rem',
                        textDecoration: 'none',
                        display: 'inline-block',
                      }}
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
