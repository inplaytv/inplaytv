'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import Papa from 'papaparse';

interface CSVGolfer {
  name: string;
  firstName?: string;
  lastName?: string;
  worldRank: number;
  skillRating?: number;
  formRating?: number;
  country?: string;
}

interface GolferMatch {
  csvGolfer: CSVGolfer;
  dbGolfer: any | null;
  status: 'matched' | 'not_found' | 'duplicate';
  changes: {
    worldRank?: { old: number | null; new: number };
    skillRating?: { old: number | null; new: number };
    formRating?: { old: number | null; new: number };
    salaryChange?: number; // Calculated new salary in pennies
  };
}

export default function RankingsUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [matches, setMatches] = useState<GolferMatch[]>([]);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMatches([]);
      setApplied(false);
      setError(null);
    }
  };

  const parseCSV = async () => {
    if (!file) return;

    setParsing(true);
    setError(null);

    try {
      const text = await file.text();
      
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const csvGolfers: CSVGolfer[] = results.data.map((row: any) => ({
            name: row.name || row.Name || `${row.first_name || row.firstName || ''} ${row.last_name || row.lastName || ''}`.trim(),
            firstName: row.first_name || row.firstName,
            lastName: row.last_name || row.lastName,
            worldRank: parseInt(row.world_rank || row.worldRank || row.rank || row.Rank),
            skillRating: row.skill_rating || row.skillRating ? parseFloat(row.skill_rating || row.skillRating) : undefined,
            formRating: row.form_rating || row.formRating ? parseFloat(row.form_rating || row.formRating) : undefined,
            country: row.country || row.Country,
          }));

          // Fetch existing golfers from database
          const supabase = createClient();
          const { data: dbGolfers, error: dbError } = await supabase
            .from('golfers')
            .select('id, first_name, last_name, world_rank, skill_rating, form_rating, salary_pennies, country');

          if (dbError) {
            setError(`Database error: ${dbError.message}`);
            setParsing(false);
            return;
          }

          // Match CSV golfers with database golfers
          const matchedGolfers: GolferMatch[] = csvGolfers.map((csvGolfer) => {
            // Try to match by name (case-insensitive, flexible)
            const dbMatch = dbGolfers.find((dbGolfer: any) => {
              const dbName = `${dbGolfer.first_name} ${dbGolfer.last_name}`.toLowerCase().trim();
              const csvName = csvGolfer.name.toLowerCase().trim();
              
              // Exact match
              if (dbName === csvName) return true;
              
              // Last name match (for "Tiger Woods" vs "Woods, Tiger")
              if (csvGolfer.lastName && dbGolfer.last_name?.toLowerCase() === csvGolfer.lastName.toLowerCase()) {
                return true;
              }
              
              return false;
            });

            const status: GolferMatch['status'] = dbMatch ? 'matched' : 'not_found';

            const changes: GolferMatch['changes'] = {};
            if (dbMatch) {
              if (dbMatch.world_rank !== csvGolfer.worldRank) {
                changes.worldRank = { old: dbMatch.world_rank, new: csvGolfer.worldRank };
              }
              if (csvGolfer.skillRating && dbMatch.skill_rating !== csvGolfer.skillRating) {
                changes.skillRating = { old: dbMatch.skill_rating, new: csvGolfer.skillRating };
              }
              if (csvGolfer.formRating && dbMatch.form_rating !== csvGolfer.formRating) {
                changes.formRating = { old: dbMatch.form_rating, new: csvGolfer.formRating };
              }

              // Calculate new salary based on rank
              const newSalary = calculateSalary(csvGolfer.worldRank, csvGolfer.skillRating);
              if (newSalary !== dbMatch.salary_pennies) {
                changes.salaryChange = newSalary;
              }
            }

            return {
              csvGolfer,
              dbGolfer: dbMatch,
              status,
              changes,
            };
          });

          setMatches(matchedGolfers);
          setParsing(false);
        },
        error: (error: Error) => {
          setError(`CSV parsing error: ${error.message}`);
          setParsing(false);
        },
      });
    } catch (err: any) {
      setError(`File read error: ${err.message}`);
      setParsing(false);
    }
  };

  const calculateSalary = (worldRank: number, skillRating?: number): number => {
    // Base salary formula: Higher rank = lower salary
    // Rank 1 = £150, Rank 300 = £10
    const baseSalary = Math.max(1000, 15000 - (worldRank * 45)); // In pennies

    // Skill bonus: Add up to £30 for high skill ratings
    const skillBonus = skillRating ? Math.round(skillRating * 300) : 0;

    const totalSalary = Math.min(15000, Math.max(1000, baseSalary + skillBonus));
    
    return totalSalary;
  };

  const applyChanges = async () => {
    setApplying(true);
    setError(null);

    const supabase = createClient();
    const matchedGolfers = matches.filter(m => m.status === 'matched' && Object.keys(m.changes).length > 0);

    try {
      // Update golfers
      for (const match of matchedGolfers) {
        const updates: any = {
          last_ranking_update: new Date().toISOString(),
          ranking_source: 'manual',
        };

        if (match.changes.worldRank) {
          updates.world_rank = match.changes.worldRank.new;
        }
        if (match.changes.skillRating) {
          updates.skill_rating = match.changes.skillRating.new;
        }
        if (match.changes.formRating) {
          updates.form_rating = match.changes.formRating.new;
        }
        if (match.changes.salaryChange) {
          updates.salary_pennies = match.changes.salaryChange;
        }

        const { error: updateError } = await supabase
          .from('golfers')
          .update(updates)
          .eq('id', match.dbGolfer.id);

        if (updateError) {
          throw new Error(`Failed to update ${match.csvGolfer.name}: ${updateError.message}`);
        }

        // Log to history
        const { error: historyError } = await supabase
          .from('golfer_ranking_history')
          .insert({
            golfer_id: match.dbGolfer.id,
            world_rank: match.changes.worldRank?.new || match.dbGolfer.world_rank,
            skill_rating: match.changes.skillRating?.new || match.dbGolfer.skill_rating,
            salary_pennies: match.changes.salaryChange || match.dbGolfer.salary_pennies,
            source: 'manual',
            recorded_at: new Date().toISOString(),
          });

        if (historyError) {
          console.warn(`Failed to log history for ${match.csvGolfer.name}:`, historyError);
        }
      }

      // Log sync operation
      await supabase.from('ranking_sync_logs').insert({
        source: 'manual',
        sync_type: 'csv_upload',
        golfers_updated: matchedGolfers.length,
        status: 'success',
        metadata: {
          filename: file?.name,
          total_rows: matches.length,
          matched: matches.filter(m => m.status === 'matched').length,
          not_found: matches.filter(m => m.status === 'not_found').length,
        },
        synced_at: new Date().toISOString(),
      });

      setApplied(true);
    } catch (err: any) {
      setError(`Failed to apply changes: ${err.message}`);
    } finally {
      setApplying(false);
    }
  };

  const formatCurrency = (pennies: number) => {
    const pounds = pennies / 100;
    return `£${pounds.toFixed(2)}`;
  };

  const statsCount = {
    total: matches.length,
    matched: matches.filter(m => m.status === 'matched').length,
    notFound: matches.filter(m => m.status === 'not_found').length,
    withChanges: matches.filter(m => m.status === 'matched' && Object.keys(m.changes).length > 0).length,
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
        Update Golfer Rankings
      </h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Upload a CSV file with golfer rankings to update salaries automatically
      </p>

      {/* CSV Format Guide */}
      <div style={{
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '2rem',
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          CSV Format Requirements:
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
          Your CSV must include these columns (order doesn't matter):
        </p>
        <ul style={{ fontSize: '0.875rem', color: '#666', paddingLeft: '1.5rem' }}>
          <li><code>name</code> or <code>first_name</code> + <code>last_name</code> - Golfer's full name</li>
          <li><code>world_rank</code> or <code>rank</code> - World ranking (1-500)</li>
          <li><code>skill_rating</code> (optional) - DataGolf skill rating (decimal)</li>
          <li><code>form_rating</code> (optional) - Recent form (0-100)</li>
          <li><code>country</code> (optional) - Country code</li>
        </ul>
        <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
          Example: <code>name,world_rank,skill_rating,form_rating,country</code>
        </p>
      </div>

      {/* File Upload */}
      <div style={{ marginBottom: '2rem' }}>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          style={{
            padding: '0.5rem',
            border: '2px solid #e5e7eb',
            borderRadius: '6px',
            marginRight: '1rem',
          }}
        />
        <button
          onClick={parseCSV}
          disabled={!file || parsing}
          style={{
            padding: '0.5rem 1.5rem',
            background: file && !parsing ? '#10b981' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: file && !parsing ? 'pointer' : 'not-allowed',
          }}
        >
          {parsing ? 'Parsing...' : 'Parse CSV'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          color: '#991b1b',
          padding: '1rem',
          borderRadius: '6px',
          marginBottom: '1rem',
        }}>
          {error}
        </div>
      )}

      {/* Success Message */}
      {applied && (
        <div style={{
          background: '#d1fae5',
          border: '1px solid #6ee7b7',
          color: '#065f46',
          padding: '1rem',
          borderRadius: '6px',
          marginBottom: '1rem',
        }}>
          ✅ Successfully updated {statsCount.withChanges} golfers!
        </div>
      )}

      {/* Stats Summary */}
      {matches.length > 0 && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            marginBottom: '2rem',
          }}>
            <div style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1rem',
            }}>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Total Rows</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{statsCount.total}</div>
            </div>
            <div style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1rem',
            }}>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Matched</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
                {statsCount.matched}
              </div>
            </div>
            <div style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1rem',
            }}>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Not Found</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>
                {statsCount.notFound}
              </div>
            </div>
            <div style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1rem',
            }}>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>With Changes</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>
                {statsCount.withChanges}
              </div>
            </div>
          </div>

          {/* Apply Button */}
          {statsCount.withChanges > 0 && !applied && (
            <button
              onClick={applyChanges}
              disabled={applying}
              style={{
                width: '100%',
                padding: '1rem',
                background: applying ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '1.125rem',
                cursor: applying ? 'not-allowed' : 'pointer',
                marginBottom: '2rem',
              }}
            >
              {applying ? 'Applying Changes...' : `Apply Changes to ${statsCount.withChanges} Golfers`}
            </button>
          )}

          {/* Preview Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: 'white',
              border: '1px solid #e5e7eb',
            }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                    Status
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                    Name
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                    World Rank
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                    Skill Rating
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                    Form Rating
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                    Salary Change
                  </th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match, idx) => (
                  <tr key={idx} style={{
                    borderBottom: '1px solid #e5e7eb',
                    background: match.status === 'not_found' ? '#fef2f2' : 'white',
                  }}>
                    <td style={{ padding: '0.75rem' }}>
                      {match.status === 'matched' ? (
                        <span style={{ color: '#10b981' }}>✓ Matched</span>
                      ) : (
                        <span style={{ color: '#ef4444' }}>✗ Not Found</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                      {match.csvGolfer.name}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {match.changes.worldRank ? (
                        <span>
                          <span style={{ color: '#9ca3af' }}>{match.changes.worldRank.old || 'N/A'}</span>
                          {' → '}
                          <span style={{ color: '#10b981', fontWeight: 600 }}>{match.changes.worldRank.new}</span>
                        </span>
                      ) : (
                        <span>{match.csvGolfer.worldRank}</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {match.changes.skillRating ? (
                        <span>
                          <span style={{ color: '#9ca3af' }}>{match.changes.skillRating.old?.toFixed(1) || 'N/A'}</span>
                          {' → '}
                          <span style={{ color: '#10b981', fontWeight: 600 }}>{match.changes.skillRating.new.toFixed(1)}</span>
                        </span>
                      ) : (
                        <span>{match.csvGolfer.skillRating?.toFixed(1) || 'N/A'}</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {match.changes.formRating ? (
                        <span>
                          <span style={{ color: '#9ca3af' }}>{match.changes.formRating.old?.toFixed(1) || 'N/A'}</span>
                          {' → '}
                          <span style={{ color: '#10b981', fontWeight: 600 }}>{match.changes.formRating.new.toFixed(1)}</span>
                        </span>
                      ) : (
                        <span>{match.csvGolfer.formRating?.toFixed(1) || 'N/A'}</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {match.changes.salaryChange && match.dbGolfer ? (
                        <span>
                          <span style={{ color: '#9ca3af' }}>{formatCurrency(match.dbGolfer.salary_pennies)}</span>
                          {' → '}
                          <span style={{ color: '#10b981', fontWeight: 600 }}>{formatCurrency(match.changes.salaryChange)}</span>
                        </span>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>No change</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
