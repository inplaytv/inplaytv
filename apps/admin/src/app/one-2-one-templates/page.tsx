'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Template {
  id: string;
  name: string;
  short_name: string;
  description: string | null;
  entry_fee_pennies: number;
  admin_fee_percent: number;
  max_players: number;
  rounds_covered: number[];
  reg_close_round: number | null;
  status: string;
  created_at: string;
}

export default function One2OneTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    description: '',
    entry_fee_pounds: '10.00',
    admin_fee_percent: '10.00',
    rounds_covered: [] as number[],
    reg_close_round: '',
    status: 'active',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/one-2-one-templates');
      
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        setError(`Failed to load templates: ${errorData.error || res.statusText}`);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      setError('Network error loading templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const url = editingId ? `/api/one-2-one-templates?id=${editingId}` : '/api/one-2-one-templates';
      const method = editingId ? 'PUT' : 'POST';
      
      const payload = {
        name: formData.name,
        short_name: formData.short_name,
        description: formData.description || null,
        entry_fee_pennies: Math.round(parseFloat(formData.entry_fee_pounds) * 100),
        admin_fee_percent: parseFloat(formData.admin_fee_percent),
        max_players: 2,
        rounds_covered: formData.rounds_covered,
        reg_close_round: formData.reg_close_round ? parseInt(formData.reg_close_round) : null,
        status: formData.status,
      };
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save template');
      }

      await fetchTemplates();
      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: '',
        short_name: '',
        description: '',
        entry_fee_pounds: '10.00',
        admin_fee_percent: '10.00',
        rounds_covered: [],
        reg_close_round: '',
        status: 'active',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (template: Template) => {
    setEditingId(template.id);
    setFormData({
      name: template.name,
      short_name: template.short_name,
      description: template.description || '',
      entry_fee_pounds: (template.entry_fee_pennies / 100).toFixed(2),
      admin_fee_percent: template.admin_fee_percent.toFixed(2),
      rounds_covered: template.rounds_covered,
      reg_close_round: template.reg_close_round?.toString() || '',
      status: template.status,
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      short_name: '',
      description: '',
      entry_fee_pounds: '10.00',
      admin_fee_percent: '10.00',
      rounds_covered: [],
      reg_close_round: '',
      status: 'active',
    });
    setError('');
  };

  const toggleRound = (round: number) => {
    setFormData(prev => ({
      ...prev,
      rounds_covered: prev.rounds_covered.includes(round)
        ? prev.rounds_covered.filter(r => r !== round)
        : [...prev.rounds_covered, round].sort()
    }));
  };

  const getRoundsDisplay = (rounds: number[]) => {
    if (rounds.length === 4) return 'All 4 Rounds';
    return rounds.map(r => `R${r}`).join(', ');
  };

  const calculatePrizePool = () => {
    const entryFee = parseFloat(formData.entry_fee_pounds) || 0;
    const adminFee = parseFloat(formData.admin_fee_percent) || 0;
    return (entryFee * 2 * (100 - adminFee) / 100).toFixed(2);
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          ONE 2 ONE Templates
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
          Manage ONE 2 ONE competition templates (head-to-head matchmaking)
        </p>
      </div>

      {error && !showForm && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '6px',
          padding: '0.875rem',
          marginBottom: '1rem',
          color: '#ef4444',
          fontSize: '0.875rem',
        }}>
          {error}
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '0.625rem 1.25rem',
            background: 'rgba(59, 130, 246, 0.9)',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.9375rem',
            marginBottom: '1.5rem',
          }}
        >
          New Template
        </button>
      )}

      {showForm && (
        <div style={{
          background: 'rgba(30, 30, 35, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.25rem' }}>
            {editingId ? 'Edit Template' : 'New Template'}
          </h2>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              padding: '0.875rem',
              marginBottom: '1rem',
              color: '#ef4444',
              fontSize: '0.875rem',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    color: '#fff',
                  }}
                  placeholder="ONE 2 ONE - All Rounds"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                  Short Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.short_name}
                  onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    color: '#fff',
                  }}
                  placeholder="All Rounds"
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                  resize: 'vertical',
                }}
                placeholder="Head-to-head across all 4 rounds"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                Rounds Covered * (Check all that apply)
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {[1, 2, 3, 4].map(round => (
                  <label key={round} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.rounds_covered.includes(round)}
                      onChange={() => toggleRound(round)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>Round {round}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                  Entry Fee (£) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.entry_fee_pounds}
                  onChange={(e) => setFormData({ ...formData, entry_fee_pounds: e.target.value })}
                  disabled={true}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    color: 'rgba(255,255,255,0.4)',
                    cursor: 'not-allowed',
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem', marginBottom: 0 }}>
                  ℹ️ Users set stakes using the slider in challenge popup
                </p>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                  Admin Fee (%) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.admin_fee_percent}
                  onChange={(e) => setFormData({ ...formData, admin_fee_percent: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    color: '#fff',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                  Prize Pool (Winner Gets)
                </label>
                <div style={{
                  padding: '0.625rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '4px',
                  color: '#10b981',
                  fontWeight: 600,
                }}>
                  £{calculatePrizePool()}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                  Registration Closes At Round
                </label>
                <select
                  value={formData.reg_close_round}
                  onChange={(e) => setFormData({ ...formData, reg_close_round: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    color: '#fff',
                  }}
                >
                  <option value="">Select Round</option>
                  <option value="1">Round 1</option>
                  <option value="2">Round 2</option>
                  <option value="3">Round 3</option>
                  <option value="4">Round 4</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                  Status *
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    color: '#fff',
                  }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: saving ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.9)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Saving...' : (editingId ? 'Update Template' : 'Create Template')}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Templates Table */}
      <div style={{
        background: 'rgba(30, 30, 35, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(0, 0, 0, 0.2)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>Template</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>Rounds</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>Entry Fee</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>Admin Fee</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>Prize Pool</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '0.875rem', textAlign: 'right', fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => {
              const prizePool = (template.entry_fee_pennies * 2 * (100 - template.admin_fee_percent)) / 10000;
              return (
                <tr key={template.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '0.875rem' }}>
                    <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: '0.25rem' }}>
                      {template.short_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                      {template.description}
                    </div>
                  </td>
                  <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                    {getRoundsDisplay(template.rounds_covered)}
                  </td>
                  <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                    £{(template.entry_fee_pennies / 100).toFixed(2)}
                  </td>
                  <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                    {template.admin_fee_percent}%
                  </td>
                  <td style={{ padding: '0.875rem', color: '#10b981', fontWeight: 600 }}>
                    £{prizePool.toFixed(2)}
                  </td>
                  <td style={{ padding: '0.875rem' }}>
                    <span style={{
                      padding: '0.25rem 0.625rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: template.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.1)',
                      color: template.status === 'active' ? '#10b981' : 'rgba(255,255,255,0.5)',
                    }}>
                      {template.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleEdit(template)}
                      style={{
                        padding: '0.375rem 0.875rem',
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        borderRadius: '4px',
                        color: '#3b82f6',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {templates.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
            No templates found. Create your first ONE 2 ONE template!
          </div>
        )}
      </div>
    </div>
  );
}
