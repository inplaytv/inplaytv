import { assertAdminOrRedirect } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Competition {
  id: string;
  tournament_id: string;
  entry_fee_pennies: number;
  entrants_cap: number;
  reg_open_at: string | null;
  reg_close_at: string | null;
  start_at: string | null;
  end_at: string | null;
  status: string;
  created_at: string;
  tournaments: {
    id: string;
    name: string;
    location: string | null;
  };
  competition_types: {
    id: string;
    name: string;
  };
}

async function getActiveCompetitions(): Promise<Competition[]> {
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from('tournament_competitions')
    .select(`
      *,
      tournaments (
        id,
        name,
        location
      ),
      competition_types (
        id,
        name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching competitions:', error);
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

function formatPennies(pennies: number) {
  return `£${(pennies / 100).toFixed(2)}`;
}

export default async function CompetitionsPage() {
  await assertAdminOrRedirect();
  const competitions = await getActiveCompetitions();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Active Competitions</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
            Competitions that are linked to tournaments and available for entrants to join
          </p>
        </div>
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
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Tournament</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Competition Type</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Entry Fee</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Cap</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Status</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Reg Opens</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Reg Closes</th>
              <th style={{ padding: '0.875rem', textAlign: 'right', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {competitions.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
                  No active competitions yet. Create tournaments and add competition types to them.
                </td>
              </tr>
            ) : (
              competitions.map((comp) => (
                <tr key={comp.id} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '0.875rem' }}>
                    <div style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500, marginBottom: '0.25rem' }}>
                      {comp.tournaments.name}
                    </div>
                    {comp.tournaments.location && (
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8125rem' }}>
                        {comp.tournaments.location}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                    {comp.competition_types.name}
                  </td>
                  <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                    {formatPennies(comp.entry_fee_pennies)}
                  </td>
                  <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                    {comp.entrants_cap === 0 ? 'Unlimited' : comp.entrants_cap.toLocaleString()}
                  </td>
                  <td style={{ padding: '0.875rem' }}>
                    {getStatusBadge(comp.status)}
                  </td>
                  <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.8125rem' }}>
                    {formatDateTime(comp.reg_open_at)}
                  </td>
                  <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.8125rem' }}>
                    {formatDateTime(comp.reg_close_at)}
                  </td>
                  <td style={{ padding: '0.875rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Link
                        href={`/competitions/${comp.id}`}
                        style={{
                          padding: '0.375rem 0.75rem',
                          background: 'rgba(16, 185, 129, 0.2)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          borderRadius: '4px',
                          color: '#10b981',
                          fontSize: '0.8rem',
                          textDecoration: 'none',
                          display: 'inline-block',
                        }}
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/tournaments/${comp.tournament_id}`}
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
                        View Tournament
                      </Link>
                    </div>
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
