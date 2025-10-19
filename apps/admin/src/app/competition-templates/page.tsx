'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CompetitionType {
  id: string;
  name: string;
  slug: string;
}

interface CompetitionTemplate {
  id: string;
  name: string;
  description: string | null;
  competition_type_id: string;
  entry_fee_pennies: number;
  entrants_cap: number;
  admin_fee_percent: number;
  reg_open_days_before: number | null;
  competition_types: CompetitionType;
  created_at: string;
}

export default function CompetitionTemplatesPage() {
  const [templates, setTemplates] = useState<CompetitionTemplate[]>([]);
  const [competitionTypes, setCompetitionTypes] = useState<CompetitionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    competition_type_id: '',
    entry_fee_pounds: '0.00',
    entrants_cap: '0',
    admin_fee_percent: '10.00',
    reg_open_days_before: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => ({
    name: '',
    description: '',
    competition_type_id: '',
    entry_fee_pounds: '0.00',
    entrants_cap: '0',
    admin_fee_percent: '10.00',
    reg_open_days_before: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [templatesRes, typesRes] = await Promise.all([
        fetch('/api/competition-templates'),
        fetch('/api/competition-types'),
      ]);
      
      if (templatesRes.ok) {
        const data = await templatesRes.json();
        setTemplates(data);
      }
      
      if (typesRes.ok) {
        const data = await typesRes.json();
        setCompetitionTypes(data);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const url = editingId ? `/api/competition-templates?id=${editingId}` : '/api/competition-templates';
      const method = editingId ? 'PUT' : 'POST';
      
      const payload = {
        name: formData.name,
        description: formData.description || null,
        competition_type_id: formData.competition_type_id,
        entry_fee_pennies: Math.round(parseFloat(formData.entry_fee_pounds) * 100),
        entrants_cap: parseInt(formData.entrants_cap),
        admin_fee_percent: parseFloat(formData.admin_fee_percent),
        reg_open_days_before: formData.reg_open_days_before ? parseInt(formData.reg_open_days_before) : null,
      };
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setFormData(resetForm());
        setShowForm(false);
        setEditingId(null);
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (template: CompetitionTemplate) => {
    setEditingId(template.id);
    setFormData({
      name: template.name,
      description: template.description || '',
      competition_type_id: template.competition_type_id,
      entry_fee_pounds: (template.entry_fee_pennies / 100).toFixed(2),
      entrants_cap: template.entrants_cap.toString(),
      admin_fee_percent: template.admin_fee_percent.toString(),
      reg_open_days_before: template.reg_open_days_before !== null ? template.reg_open_days_before.toString() : '',
    });
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete template "${name}"?`)) return;

    try {
      const res = await fetch(`/api/competition-templates?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to delete');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(resetForm());
    setError('');
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Competition Templates
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
          Create reusable presets for competitions (e.g., Free Entry, £10 Economy, £50 Standard)
        </p>
      </div>

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
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                Template Name *
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
                placeholder="e.g., Full Course - Economy (£10)"
              />
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
                placeholder="Optional description"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                Competition Type *
              </label>
              <select
                required
                value={formData.competition_type_id}
                onChange={(e) => setFormData({ ...formData, competition_type_id: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
              >
                <option value="">Select type...</option>
                {competitionTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
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
                  Entrants Cap *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.entrants_cap}
                  onChange={(e) => setFormData({ ...formData, entrants_cap: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    color: '#fff',
                  }}
                  placeholder="0 = unlimited"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                  Admin Fee % *
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
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                Reg Opens (Days Before Tournament)
              </label>
              <input
                type="number"
                min="0"
                value={formData.reg_open_days_before}
                onChange={(e) => setFormData({ ...formData, reg_open_days_before: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
                placeholder="e.g., 7, 5, 3 (optional)"
              />
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
                  fontSize: '0.9375rem',
                }}
              >
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.9375rem',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{
        background: 'rgba(30, 30, 35, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Name</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Type</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Entry Fee</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Admin %</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Reg Opens</th>
              <th style={{ padding: '0.875rem', textAlign: 'right', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
                  No templates yet. Create one to get started.
                </td>
              </tr>
            ) : (
              templates.map((template) => (
                <tr key={template.id} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '0.875rem' }}>
                    <div style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>{template.name}</div>
                    {template.description && (
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{template.description}</div>
                    )}
                  </td>
                  <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                    {template.competition_types.name}
                  </td>
                  <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                    £{(template.entry_fee_pennies / 100).toFixed(2)}
                  </td>
                  <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                    {template.admin_fee_percent}%
                  </td>
                  <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                    {template.reg_open_days_before !== null ? `${template.reg_open_days_before} days` : '—'}
                  </td>
                  <td style={{ padding: '0.875rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleEdit(template)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          background: 'rgba(59, 130, 246, 0.2)',
                          border: '1px solid rgba(59, 130, 246, 0.4)',
                          borderRadius: '4px',
                          color: '#60a5fa',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(template.id, template.name)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          borderRadius: '4px',
                          color: '#ef4444',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
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
