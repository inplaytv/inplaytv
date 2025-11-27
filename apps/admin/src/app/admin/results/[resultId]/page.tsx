'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useParams, useRouter } from 'next/navigation';

export default function ResultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const resultId = params.resultId as string;
  
  const [result, setResult] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (resultId) {
      loadResultDetails();
    }
  }, [resultId]);

  async function loadResultDetails() {
    try {
      setLoading(true);
      const supabase = createClient();

      // Load result
      const { data: resultData, error: resultError } = await supabase
        .from('competition_results')
        .select('*')
        .eq('id', resultId)
        .single();

      if (resultError) throw resultError;
      setResult(resultData);

      // Load payouts
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('competition_payouts')
        .select('*')
        .eq('competition_result_id', resultId)
        .order('final_position', { ascending: true });

      if (payoutsError) throw payoutsError;
      setPayouts(payoutsData || []);

      // Load analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('competition_analytics')
        .select('*')
        .eq('competition_result_id', resultId)
        .single();

      if (analyticsError) console.error('Analytics error:', analyticsError);
      setAnalytics(analyticsData);

    } catch (error) {
      console.error('Error loading details:', error);
    } finally {
      setLoading(false);
    }
  }

  async function exportToCSV() {
    if (!result) return;

    const csvData = [
      ['Competition Results Export'],
      [''],
      ['Competition', result.competition_name],
      ['Tournament', result.tournament_name],
      ['Date', new Date(result.completed_at).toLocaleDateString()],
      ['Total Entries', result.total_entries],
      ['Prize Pool', `£${(result.total_prize_pool_pennies / 100).toFixed(2)}`],
      [''],
      ['Winners'],
      ['Position', 'Username', 'Entry Name', 'Points', 'Prize Amount'],
      ...payouts.map(p => [
        p.final_position,
        p.username,
        p.entry_name,
        p.total_points,
        `£${(p.prize_amount_pennies / 100).toFixed(2)}`
      ]),
      [''],
      ['Full Leaderboard'],
      ['Position', 'Username', 'Entry Name', 'Points', 'Golfers'],
      ...result.full_leaderboard.map((e: any) => [
        e.position,
        `User ${e.userId.substring(0, 8)}`,
        e.entryName,
        e.points,
        e.golfers.map((g: any) => g.name).join(', ')
      ])
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.competition_slug}-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#6b7280' }}>Loading results...</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#6b7280' }}>Result not found</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={() => router.back()}
          style={{
            marginBottom: '16px',
            padding: '8px 16px',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#1f2937',
            fontWeight: 500
          }}
        >
          ← Back to Results
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
              {result.competition_name}
            </h1>
            <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '8px' }}>
              {result.tournament_name} • {new Date(result.completed_at).toLocaleDateString()}
            </p>
            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#9ca3af' }}>
              <div>
                <strong>Result ID:</strong> {result.id}
              </div>
              <div>
                <strong>Competition ID:</strong> {result.competition_id}
              </div>
            </div>
          </div>
          
          <button
            onClick={exportToCSV}
            style={{
              padding: '12px 24px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            📊 Export to CSV
          </button>
        </div>
      </div>

      {/* Winner Highlight */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '32px',
        borderRadius: '16px',
        marginBottom: '32px',
        color: 'white'
      }}>
        <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          🏆 Champion
        </div>
        <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
          {result.winner_entry_name}
        </div>
        <div style={{ fontSize: '18px', opacity: 0.9, marginBottom: '16px' }}>
          {result.winner_username}
        </div>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>Winning Score</div>
            <div style={{ fontSize: '36px', fontWeight: 700 }}>{result.winning_points}</div>
          </div>
          <div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>Prize</div>
            <div style={{ fontSize: '36px', fontWeight: 700 }}>
              £{((payouts[0]?.prize_amount_pennies || 0) / 100).toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>Beat</div>
            <div style={{ fontSize: '36px', fontWeight: 700 }}>{result.total_entries - 1}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <a
              href={`/competitions/${result.competition_id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600,
                border: '2px solid rgba(255,255,255,0.3)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              📋 View Competition Details →
            </a>
          </div>
        </div>
      </div>

      {/* Top 3 Payouts */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937', marginBottom: '16px' }}>
          Prize Winners
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {payouts.map((payout, idx) => (
            <div key={payout.id} style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              border: `2px solid ${idx === 0 ? '#fbbf24' : idx === 1 ? '#9ca3af' : '#cd7f32'}`
            }}>
              <div style={{ fontSize: '48px', textAlign: 'center', marginBottom: '12px' }}>
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
              </div>
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#1f2937' }}>
                  {payout.entry_name}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  {payout.username}
                </div>
              </div>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#667eea' }}>
                  {payout.total_points}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>points</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
                  £{(payout.prize_amount_pennies / 100).toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {payout.prize_percentage}% of prize pool
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics */}
      {analytics && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937', marginBottom: '16px' }}>
            Competition Analytics
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Unique Users</div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#1f2937' }}>{analytics.total_unique_users}</div>
            </div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Avg Score</div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#1f2937' }}>{analytics.average_score?.toFixed(1)}</div>
            </div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Highest Score</div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#10b981' }}>{analytics.highest_score}</div>
            </div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Lowest Score</div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#ef4444' }}>{analytics.lowest_score}</div>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937', marginBottom: '16px' }}>
          Full Leaderboard ({result.full_leaderboard.length} Entries)
        </h2>
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Pos</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Entry</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Entry ID</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Points</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Golfers</th>
              </tr>
            </thead>
            <tbody>
              {result.full_leaderboard.map((entry: any) => (
                <tr key={entry.entryId} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: entry.position <= 3 ? '#667eea' : '#1f2937' }}>
                    {entry.position}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#1f2937' }}>{entry.entryName}</div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>User {entry.userId.substring(0, 8)}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace' }}>
                    {entry.entryId}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, fontSize: '16px', color: '#667eea' }}>
                    {entry.points}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                    {entry.golfers.map((g: any) => (
                      <span key={g.golferId}>
                        {g.name}{g.isCaptain ? ' (C)' : ''} ({g.fantasyPoints}pts)
                        {', '}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
