'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Golfer {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  image_url: string | null;
  external_id: string | null;
  created_at?: string;
}

export default function GolfersPage() {
  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    image_url: '',
    external_id: '',
  });

  useEffect(() => {
    fetchGolfers();
  }, []);

  async function fetchGolfers() {
    try {
      const response = await fetch('/api/golfers');
      if (!response.ok) throw new Error('Failed to fetch golfers');
      const data = await response.json();
      setGolfers(data);
    } catch (error) {
      console.error('Fetch error:', error);
      alert('Failed to load golfers');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      first_name: '',
      last_name: '',
      image_url: '',
      external_id: '',
    });
    setEditing(null);
    setAdding(false);
  }

  function handleEdit(golfer: Golfer) {
    setFormData({
      first_name: golfer.first_name,
      last_name: golfer.last_name,
      image_url: golfer.image_url || '',
      external_id: golfer.external_id || '',
    });
    setEditing(golfer.id);
    setAdding(false);
  }

  function handleAdd() {
    resetForm();
    setAdding(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      alert('First name and last name are required');
      return;
    }

    try {
      if (editing) {
        // Update existing golfer
        const response = await fetch(`/api/golfers?id=${editing}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            image_url: formData.image_url.trim() || null,
            external_id: formData.external_id.trim() || null,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update golfer');
        }

        alert('Golfer updated successfully');
      } else {
        // Create new golfer
        const response = await fetch('/api/golfers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            image_url: formData.image_url.trim() || null,
            external_id: formData.external_id.trim() || null,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create golfer');
        }

        alert('Golfer created successfully');
      }

      resetForm();
      fetchGolfers();
    } catch (error: any) {
      console.error('Submit error:', error);
      alert(error.message);
    }
  }

  async function handleDelete(id: string, fullName: string) {
    if (!confirm(`Delete ${fullName}? This cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/golfers?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete golfer');
      }

      alert('Golfer deleted successfully');
      fetchGolfers();
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(error.message);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <p>Loading golfers...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem',
      }}>
        <div>
          <h1 style={{ 
            margin: '0 0 0.5rem 0', 
            fontSize: '1.75rem', 
            fontWeight: 700,
            color: 'rgba(255,255,255,0.9)',
          }}>
            Golfers
          </h1>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
            Manage golfers who can be added to tournaments
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link
            href="/tournaments"
            style={{
              padding: '0.625rem 1.25rem',
              background: 'rgba(100,100,100,0.2)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '6px',
              color: 'rgba(255,255,255,0.7)',
              textDecoration: 'none',
              display: 'inline-block',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            ← Back
          </Link>
          {!adding && !editing && (
            <button
              onClick={handleAdd}
              style={{
                padding: '0.625rem 1.25rem',
                background: 'rgba(59, 130, 246, 0.9)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              + Add Golfer
            </button>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      {(adding || editing) && (
        <div style={{
          background: 'rgba(30, 30, 35, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
            {editing ? 'Edit Golfer' : 'Add New Golfer'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                  Image URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                  External ID (optional)
                </label>
                <input
                  type="text"
                  value={formData.external_id}
                  onChange={(e) => setFormData({ ...formData, external_id: e.target.value })}
                  placeholder="e.g., PGA Tour ID"
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="submit"
                style={{
                  padding: '0.625rem 1.25rem',
                  background: 'rgba(16, 185, 129, 0.9)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                {editing ? 'Update Golfer' : 'Create Golfer'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: 'rgba(100, 100, 100, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  color: 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Golfers Table */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Name</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Image</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>External ID</th>
              <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {golfers.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  No golfers found. Click "Add Golfer" to create one.
                </td>
              </tr>
            ) : (
              golfers.map((golfer) => (
                <tr
                  key={golfer.id}
                  style={{ borderBottom: '1px solid #dee2e6' }}
                >
                  <td style={{ padding: '12px' }}>
                    <strong>{golfer.full_name}</strong>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {golfer.image_url ? (
                      <img
                        src={golfer.image_url}
                        alt={golfer.full_name}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: '#e0e0e0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: '#666',
                        }}
                      >
                        {golfer.first_name[0]}{golfer.last_name[0]}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px', color: '#666' }}>
                    {golfer.external_id || '—'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleEdit(golfer)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginRight: '8px',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(golfer.id, golfer.full_name)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
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

      {/* Summary */}
      <div style={{ marginTop: '20px', color: '#666', fontSize: '14px' }}>
        <p>
          <strong>{golfers.length}</strong> golfer{golfers.length !== 1 ? 's' : ''} total
        </p>
      </div>
    </div>
  );
}
