'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface OutboxEmail {
  id: string;
  sent_by_name?: string;
  sent_by_email: string;
  recipients: string[];
  subject: string;
  content: string;
  status: string;
  sent_at: string;
  delivered_at?: string;
  bounced_at?: string;
  bounce_reason?: string;
  opened_at?: string;
}

export default function EmailOutboxPage() {
  const [emails, setEmails] = useState<OutboxEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<OutboxEmail | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'delivered' | 'bounced'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchEmails();
  }, [statusFilter]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'all' 
        ? '/api/email/outbox'
        : `/api/email/outbox?status=${statusFilter}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch emails');
      
      const { emails: data } = await response.json();
      setEmails(data || []);
    } catch (err) {
      console.error('Error fetching emails:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmails = emails.filter(email => {
    if (searchTerm && !email.recipients.some(r => r.toLowerCase().includes(searchTerm.toLowerCase())) &&
        !email.subject.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (dateFilter && !email.sent_at.startsWith(dateFilter)) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status: string, email: OutboxEmail) => {
    const colors: Record<string, string> = {
      sent: '#3b82f6',
      delivered: '#10b981',
      bounced: '#ef4444',
      failed: '#8b5cf6',
    };

    return (
      <div>
        <span style={{
          padding: '0.25rem 0.75rem',
          background: colors[status] || '#888',
          color: '#fff',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'capitalize',
        }}>
          {status}
        </span>
        {email.bounced_at && (
          <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '0.25rem' }}>
            Hard Bounce - {new Date(email.bounced_at).toLocaleString()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#fff' }}>
            Email Outbox
          </h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link
              href="/email/inbox"
              style={{
                padding: '0.75rem 1.5rem',
                background: '#2a2a2a',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              📥 Inbox
            </Link>
            <Link
              href="/email/compose"
              style={{
                padding: '0.75rem 1.5rem',
                background: '#3b82f6',
                color: '#fff',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              ✉️ Compose Email
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div style={{ 
          background: '#1e1e1e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              padding: '0.5rem',
              background: '#2a2a2a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.875rem',
            }}
            placeholder="Filter by date"
          />

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['all', 'sent', 'delivered', 'bounced'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '0.5rem 1rem',
                  background: statusFilter === status ? '#3b82f6' : '#2a2a2a',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                }}
              >
                {status}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by keyword..."
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '0.5rem 1rem',
              background: '#2a2a2a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.875rem',
            }}
          />
        </div>

        {/* Emails Table */}
        <div style={{
          background: '#1e1e1e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
              Loading sent emails...
            </div>
          ) : filteredEmails.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
              No emails found
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#2a2a2a', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontSize: '0.875rem', fontWeight: 600 }}>
                      Status
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontSize: '0.875rem', fontWeight: 600 }}>
                      Date
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontSize: '0.875rem', fontWeight: 600 }}>
                      Sent By
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontSize: '0.875rem', fontWeight: 600 }}>
                      Recipient
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontSize: '0.875rem', fontWeight: 600 }}>
                      Email Content
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontSize: '0.875rem', fontWeight: 600 }}>
                      Activity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmails.map((email) => (
                    <tr key={email.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem' }}>
                        {getStatusBadge(email.status, email)}
                      </td>
                      <td style={{ padding: '1rem', color: '#fff', fontSize: '0.875rem' }}>
                        {new Date(email.sent_at).toLocaleDateString()}<br />
                        <span style={{ fontSize: '0.75rem', color: '#888' }}>
                          {new Date(email.sent_at).toLocaleTimeString()}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: '#fff', fontSize: '0.875rem' }}>
                        {email.sent_by_name || 'InPlay Admin'}<br />
                        <span style={{ fontSize: '0.75rem', color: '#888' }}>
                          {email.sent_by_email}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: '#fff', fontSize: '0.875rem' }}>
                        {email.recipients.join(', ')}
                      </td>
                      <td style={{ padding: '1rem', color: '#fff', fontSize: '0.875rem' }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                          {email.subject}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#888' }}>
                          {email.content.substring(0, 60)}...
                        </div>
                        <button
                          onClick={() => setSelectedEmail(email)}
                          style={{
                            marginTop: '0.5rem',
                            padding: '0.25rem 0.75rem',
                            background: '#3b82f6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                          }}
                        >
                          See Email
                        </button>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.75rem', color: '#888' }}>
                        {email.delivered_at && (
                          <div style={{ color: '#10b981' }}>
                            ✓ Delivered - {new Date(email.delivered_at).toLocaleString()}
                          </div>
                        )}
                        {email.opened_at && (
                          <div style={{ color: '#3b82f6' }}>
                            👁️ Opened - {new Date(email.opened_at).toLocaleString()}
                          </div>
                        )}
                        {email.bounce_reason && (
                          <div style={{ color: '#ef4444' }}>
                            ⚠️ {email.bounce_reason}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* View Email Modal */}
        {selectedEmail && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem',
          }}>
            <div style={{
              background: '#1e1e1e',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              padding: '2rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff' }}>
                  {selectedEmail.subject}
                </h2>
                <button
                  onClick={() => setSelectedEmail(null)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  Close
                </button>
              </div>

              <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: '#fff' }}>
                <div><strong>From:</strong> {selectedEmail.sent_by_name || 'InPlay Admin'} ({selectedEmail.sent_by_email})</div>
                <div><strong>To:</strong> {selectedEmail.recipients.join(', ')}</div>
                <div><strong>Sent:</strong> {new Date(selectedEmail.sent_at).toLocaleString()}</div>
                <div><strong>Status:</strong> {getStatusBadge(selectedEmail.status, selectedEmail)}</div>
              </div>

              <div style={{
                padding: '1.5rem',
                background: '#2a2a2a',
                borderRadius: '6px',
                color: '#fff',
                whiteSpace: 'pre-wrap',
              }}>
                {selectedEmail.content}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
