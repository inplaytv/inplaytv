'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PromotionalCard {
  id: string;
  title: string;
  subtitle: string | null;
  location: string | null;
  date_range: string | null;
  prize_pool_display: string | null;
  entries_display: string | null;
  entry_fee_display: string | null;
  first_place_display: string | null;
  background_image: string;
  card_type: 'featured' | 'small';
  display_order: number;
  is_active: boolean;
  link_url: string | null;
  badge_text: string | null;
  badge_style: string | null;
  created_at: string;
  updated_at: string;
}

export default function PromotionalCardsPage() {
  const [cards, setCards] = useState<PromotionalCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const res = await fetch('/api/promotional-cards');
      if (!res.ok) throw new Error('Failed to fetch promotional cards');
      const data = await res.json();
      setCards(data.sort((a: PromotionalCard, b: PromotionalCard) => a.display_order - b.display_order));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/promotional-cards/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentActive }),
      });

      if (!res.ok) throw new Error('Failed to update card');
      fetchCards();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const deleteCard = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/promotional-cards/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete card');
      fetchCards();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const moveCard = async (id: string, direction: 'up' | 'down') => {
    const index = cards.findIndex(c => c.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === cards.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newCards = [...cards];
    [newCards[index], newCards[newIndex]] = [newCards[newIndex], newCards[index]];

    // Update display_order for all affected cards
    try {
      await Promise.all(
        newCards.map((card, idx) =>
          fetch(`/api/promotional-cards/${card.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ display_order: idx + 1 }),
          })
        )
      );
      fetchCards();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
          Loading promotional cards...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Promotional Cards
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
            Manage the promotional tournament cards displayed on the tournaments page
          </p>
        </div>
        <Link
          href="/promotional-cards/new"
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
          + Add New Card
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: '#f87171',
          marginBottom: '1.5rem',
        }}>
          {error}
        </div>
      )}

      {/* Info Box */}
      <div style={{
        padding: '1rem',
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '8px',
        marginBottom: '1.5rem',
      }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#60a5fa' }}>
          📸 Background Images
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
          Background images should be placed in: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0.125rem 0.375rem', borderRadius: '3px' }}>apps/golf/public/images/tournaments/</code>
          <br />
          Supported formats: .jpg, .png | Recommended size: 300×180px
        </p>
      </div>

      {/* Cards List */}
      <div style={{
        background: 'rgba(30, 30, 35, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem', width: '50px' }}>Order</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Title</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Type</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Background</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Badge</th>
              <th style={{ padding: '0.875rem', textAlign: 'center', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Status</th>
              <th style={{ padding: '0.875rem', textAlign: 'right', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cards.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
                  No promotional cards yet. Create one to get started.
                </td>
              </tr>
            ) : (
              cards.map((card, index) => (
                <tr key={card.id} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '0.875rem' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', flexDirection: 'column' }}>
                      <button
                        onClick={() => moveCard(card.id, 'up')}
                        disabled={index === 0}
                        style={{
                          padding: '0.125rem 0.375rem',
                          background: index === 0 ? 'rgba(100,100,100,0.2)' : 'rgba(59, 130, 246, 0.2)',
                          border: `1px solid ${index === 0 ? 'rgba(100,100,100,0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
                          borderRadius: '3px',
                          color: index === 0 ? '#6b7280' : '#60a5fa',
                          fontSize: '0.75rem',
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveCard(card.id, 'down')}
                        disabled={index === cards.length - 1}
                        style={{
                          padding: '0.125rem 0.375rem',
                          background: index === cards.length - 1 ? 'rgba(100,100,100,0.2)' : 'rgba(59, 130, 246, 0.2)',
                          border: `1px solid ${index === cards.length - 1 ? 'rgba(100,100,100,0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
                          borderRadius: '3px',
                          color: index === cards.length - 1 ? '#6b7280' : '#60a5fa',
                          fontSize: '0.75rem',
                          cursor: index === cards.length - 1 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        ↓
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '0.875rem' }}>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500, marginBottom: '0.25rem' }}>
                        {card.title}
                      </div>
                      {card.subtitle && (
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                          {card.subtitle}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '0.875rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      background: card.card_type === 'featured' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                      border: `1px solid ${card.card_type === 'featured' ? 'rgba(139, 92, 246, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      color: card.card_type === 'featured' ? '#a78bfa' : '#60a5fa',
                      textTransform: 'uppercase',
                    }}>
                      {card.card_type}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>
                    {card.background_image}
                  </td>
                  <td style={{ padding: '0.875rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                    {card.badge_text || '—'}
                  </td>
                  <td style={{ padding: '0.875rem', textAlign: 'center' }}>
                    <button
                      onClick={() => toggleActive(card.id, card.is_active)}
                      style={{
                        padding: '0.25rem 0.625rem',
                        background: card.is_active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 100, 100, 0.2)',
                        border: `1px solid ${card.is_active ? 'rgba(16, 185, 129, 0.4)' : 'rgba(100, 100, 100, 0.4)'}`,
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: card.is_active ? '#10b981' : '#9ca3af',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                      }}
                    >
                      {card.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td style={{ padding: '0.875rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Link
                        href={`/promotional-cards/${card.id}`}
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
                      <button
                        onClick={() => deleteCard(card.id, card.title)}
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
