'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import Link from 'next/link';

interface CompetitionResult {
  id: string;
  competition_name: string;
  tournament_name: string;
  completed_at: string;
  total_entries: number;
  total_prize_pool_pennies: number;
  admin_fee_pennies: number;
  winner_username: string;
  winner_entry_name: string;
  winning_points: number;
  status: string;
  competition_id: string;
  max_entries?: number;
}

export default function CompetitionResultsPage() {
  const [results, setResults] = useState<CompetitionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending_payout' | 'paid_out' | 'finalized'>('all');

  useEffect(() => {
    loadResults();
  }, [filter]);

  async function loadResults() {
    try {
      setLoading(true);
      const supabase = createClient();
      
      // Fetch results with competition details to get max_entries
      let query = supabase
        .from('competition_results')
        .select(`
          *,
          competition:tournament_competitions!competition_id(
            entrants_cap
          )
        `)
        .order('completed_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading results:', error);
        throw error;
      }
      
      // Flatten the data structure to include max_entries at top level
      const resultsWithMaxEntries = (data || []).map((result: any) => ({
        ...result,
        max_entries: result.competition?.entrants_cap
      }));
      
      setResults(resultsWithMaxEntries);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsPaidOut(resultId: string) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('competition_results')
        .update({
          status: 'paid_out',
          payout_processed_at: new Date().toISOString()
        })
        .eq('id', resultId);

      if (error) throw error;
      
      alert('✅ Marked as paid out!');
      loadResults();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
          Competition Results
        </h1>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>
          View completed competitions, winners, and manage payouts
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
        {(['all', 'pending_payout', 'paid_out', 'finalized'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: '8px 16px',
              background: filter === status ? '#667eea' : 'transparent',
              color: filter === status ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: filter === status ? 600 : 400,
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            {status === 'all' ? 'All Results' : status.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Competitions</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#1f2937' }}>{results.length}</div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Prize Pool</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#10b981' }}>
            £{(results.reduce((sum, r) => sum + r.total_prize_pool_pennies, 0) / 100).toLocaleString()}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
            Minus Admin Fee: <span style={{ fontWeight: 600, color: '#10b981' }}>
              £{(results.reduce((sum, r) => sum + (r.total_prize_pool_pennies - r.admin_fee_pennies), 0) / 100).toLocaleString()}
            </span>
          </div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Pending Payouts</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#f59e0b' }}>
            {results.filter(r => r.status === 'pending_payout').length}
          </div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Entries</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#667eea' }}>
            {results.reduce((sum, r) => sum + r.total_entries, 0)}
          </div>
        </div>
      </div>

      {/* Results Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
          Loading results...
        </div>
      ) : results.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '48px', 
          background: 'white', 
          borderRadius: '12px',
          border: '2px dashed #e5e7eb'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '8px' }}>
            No results yet
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Competition results will appear here after finalization
          </div>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                  Competition
                </th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                  IDs
                </th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                  Winner
                </th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                  Points
                </th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                  Entries
                </th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                  Admin Fee
                </th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                  Prize Pool
                </th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                  Status
                </th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>
                      {result.competition_name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      {result.tournament_name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                      {new Date(result.completed_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                      <strong>Result:</strong> {result.id.substring(0, 8)}...
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px' }}>
                      <strong>Competition:</strong> {result.competition_id.substring(0, 8)}...
                    </div>
                    <Link
                      href={`/competitions/${result.competition_id}`}
                      style={{
                        fontSize: '11px',
                        color: '#667eea',
                        textDecoration: 'underline',
                        fontWeight: 500
                      }}
                    >
                      View Competition →
                    </Link>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 600, color: '#1f2937' }}>
                      {result.winner_entry_name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      {result.winner_username}
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700, color: '#667eea', fontSize: '16px' }}>
                    {result.winning_points}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: '#1f2937' }}>
                    {result.total_entries}{result.max_entries ? ` / ${result.max_entries}` : ''}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: '#f59e0b' }}>
                    {result.total_prize_pool_pennies > 0 
                      ? `${((result.admin_fee_pennies / result.total_prize_pool_pennies) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700, color: '#10b981', fontSize: '16px' }}>
                    £{(result.total_prize_pool_pennies / 100).toLocaleString()}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: result.status === 'paid_out' ? '#d1fae5' : result.status === 'pending_payout' ? '#fef3c7' : '#e0e7ff',
                      color: result.status === 'paid_out' ? '#065f46' : result.status === 'pending_payout' ? '#92400e' : '#3730a3'
                    }}>
                      {result.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <Link
                        href={`/admin/results/${result.id}`}
                        style={{
                          padding: '6px 12px',
                          background: '#667eea',
                          color: 'white',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 600,
                          textDecoration: 'none',
                          display: 'inline-block'
                        }}
                      >
                        View Details
                      </Link>
                      {result.status === 'pending_payout' && (
                        <button
                          onClick={() => markAsPaidOut(result.id)}
                          style={{
                            padding: '6px 12px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
