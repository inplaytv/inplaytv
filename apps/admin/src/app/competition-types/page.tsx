'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CompetitionType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  default_entry_fee_pennies: number | null;
  default_entrants_cap: number | null;
  default_admin_fee_percent: number | null;
  default_reg_open_days_before: number | null;
  rounds_count: number | null;
  is_template: boolean;
  created_at: string;
}

export default function CompetitionTypesPage() {
  const [types, setTypes] = useState<CompetitionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    is_template: false,
    default_entry_fee_pounds: '',
    default_entrants_cap: '',
    default_admin_fee_percent: '',
    default_reg_open_days_before: '',
    rounds_count: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const resetForm = () => ({
    name: '',
    slug: '',
    description: '',
    is_template: false,
    default_entry_fee_pounds: '',
    default_entrants_cap: '',
    default_admin_fee_percent: '',
    default_reg_open_days_before: '',
    rounds_count: '',
  });

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const res = await fetch('/api/competition-types');
      if (res.ok) {
        const data = await res.json();
        setTypes(data);
      }
    } catch (err) {
      console.error('Failed to fetch types:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const url = editingId ? `/api/competition-types?id=${editingId}` : '/api/competition-types';
      const method = editingId ? 'PUT' : 'POST';
      
      // Convert template fields
      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        is_template: formData.is_template,
        rounds_count: formData.rounds_count ? parseInt(formData.rounds_count) : null,
        default_entry_fee_pennies: formData.default_entry_fee_pounds ? Math.round(parseFloat(formData.default_entry_fee_pounds) * 100) : null,
        default_entrants_cap: formData.default_entrants_cap ? parseInt(formData.default_entrants_cap) : null,
        default_admin_fee_percent: formData.default_admin_fee_percent ? parseFloat(formData.default_admin_fee_percent) : null,
        default_reg_open_days_before: formData.default_reg_open_days_before ? parseInt(formData.default_reg_open_days_before) : null,
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
        fetchTypes();
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

  const handleEdit = (type: CompetitionType) => {
    setEditingId(type.id);
    setFormData({
      name: type.name,
      slug: type.slug,
      description: type.description || '',
      is_template: type.is_template || false,
      rounds_count: type.rounds_count !== null ? type.rounds_count.toString() : '',
      default_entry_fee_pounds: type.default_entry_fee_pennies ? (type.default_entry_fee_pennies / 100).toFixed(2) : '',
      default_entrants_cap: type.default_entrants_cap !== null ? type.default_entrants_cap.toString() : '',
      default_admin_fee_percent: type.default_admin_fee_percent !== null ? type.default_admin_fee_percent.toString() : '',
      default_reg_open_days_before: type.default_reg_open_days_before !== null ? type.default_reg_open_days_before.toString() : '',
    });
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This will affect all tournaments using this competition type.`)) return;

    try {
      const res = await fetch(`/api/competition-types?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTypes();
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

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Competition Types</h1>
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
            }}
          >
            Create Competition Type
          </button>
        )}
      </div>

      {showForm && (
        <div style={{
          background: 'rgba(30, 30, 35, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 600 }}>
            {editingId ? 'Edit Competition Type' : 'Create Competition Type'}
          </h2>
          
          {error && (
            <div style={{
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '4px',
              color: '#f87171',
              marginBottom: '1rem',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (!editingId) {
                    setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) });
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
                placeholder="e.g., Full Course, Round 1, Round 2"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                Slug *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
                placeholder="e.g., full-course, round-1"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                Number of Rounds <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                min="1"
                max="4"
                value={formData.rounds_count}
                onChange={(e) => setFormData({ ...formData, rounds_count: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
                placeholder="e.g., 4 for Full Course, 2 for Beat The Cut, 1 for Final Strike"
              />
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                Specify how many rounds this competition type covers (1-4)
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
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

            {/* Template Settings */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '6px',
              padding: '1rem',
              marginBottom: '1.5rem',
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_template}
                    onChange={(e) => setFormData({ ...formData, is_template: e.target.checked })}
                    style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.875rem', color: 'rgba(16, 185, 129, 0.9)', fontWeight: 600 }}>
                    Enable Template (Pre-fill defaults)
                  </span>
                </label>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem', marginLeft: '1.5rem' }}>
                  When enabled, these values will auto-populate when adding this competition type to a tournament
                </p>
              </div>

              {formData.is_template && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                        Default Entry Fee (£)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.default_entry_fee_pounds}
                        onChange={(e) => setFormData({ ...formData, default_entry_fee_pounds: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.625rem',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '4px',
                          color: '#fff',
                        }}
                        placeholder="e.g., 5.00, 20.00, 50.00"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                        Default Entrants Cap
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.default_entrants_cap}
                        onChange={(e) => setFormData({ ...formData, default_entrants_cap: e.target.value })}
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
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                        Default Admin Fee %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.default_admin_fee_percent}
                        onChange={(e) => setFormData({ ...formData, default_admin_fee_percent: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.625rem',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '4px',
                          color: '#fff',
                        }}
                        placeholder="e.g., 10, 8, 5"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                        Reg Opens (Days Before Tournament)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.default_reg_open_days_before}
                        onChange={(e) => setFormData({ ...formData, default_reg_open_days_before: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.625rem',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '4px',
                          color: '#fff',
                        }}
                        placeholder="e.g., 7, 5, 3"
                      />
                    </div>
                  </div>
                </>
              )}
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
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: 'rgba(100, 100, 100, 0.5)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
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
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Slug</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Description</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Created</th>
              <th style={{ padding: '0.875rem', textAlign: 'right', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {types.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
                  No competition types yet. Create one to get started.
                </td>
              </tr>
            ) : (
              types.map((type) => (
                <tr key={type.id} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                    {type.name}
                    {type.is_template && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'rgba(16, 185, 129, 0.9)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.125rem 0.375rem', borderRadius: '3px' }}>
                        ⚡ Template
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', fontSize: '0.85rem' }}>{type.slug}</td>
                  <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                    {type.description || '—'}
                  </td>
                  <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                    {new Date(type.created_at).toLocaleDateString('en-GB')}
                  </td>
                  <td style={{ padding: '0.875rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleEdit(type)}
                      style={{
                        padding: '0.375rem 0.75rem',
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        borderRadius: '4px',
                        color: '#60a5fa',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        marginRight: '0.5rem',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(type.id, type.name)}
                      style={{
                        padding: '0.375rem 0.75rem',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: '4px',
                        color: '#f87171',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
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
