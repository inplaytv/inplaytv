'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface InboxMessage {
  id: string;
  form_name?: string;
  sender_name?: string;
  sender_email: string;
  sender_phone?: string;
  sender_ip?: string;
  subject?: string;
  message: string;
  web_page?: string;
  status: string;
  internal_notes?: string;
  received_at: string;
}

export default function EmailInboxPage() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const [internalNote, setInternalNote] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'replied'>('all');

  useEffect(() => {
    fetchMessages();
  }, [filter]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const url = filter === 'all' 
        ? '/api/email/inbox'
        : `/api/email/inbox?status=${filter}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedMessage || !internalNote.trim()) return;

    try {
      const response = await fetch(`/api/email/inbox/${selectedMessage.id}/note`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: internalNote.trim() }),
      });

      if (response.ok) {
        alert('✅ Note saved successfully');
        setSelectedMessage({ ...selectedMessage, internal_notes: internalNote });
        fetchMessages();
      }
    } catch (err) {
      console.error('Error saving note:', err);
    }
  };

  const handleMarkAs = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/email/inbox/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchMessages();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#fff' }}>
            Forms Inbox
          </h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link
              href="/email/outbox"
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
              📤 Outbox
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

        <div style={{ 
          background: '#1e1e1e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '0.5rem'
        }}>
          {(['all', 'unread', 'read', 'replied'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '0.5rem 1rem',
                background: filter === status ? '#3b82f6' : '#2a2a2a',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >
              {status} {status === 'all' && `(${messages.length})`}
            </button>
          ))}
        </div>

        <div style={{
          background: '#1e1e1e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
              No messages found
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#2a2a2a', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontSize: '0.875rem', fontWeight: 600 }}>
                      Actions
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontSize: '0.875rem', fontWeight: 600 }}>
                      Inquiry Details
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontSize: '0.875rem', fontWeight: 600 }}>
                      Internal Notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((msg) => (
                    <tr key={msg.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <button
                            onClick={() => setSelectedMessage(msg)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#3b82f6',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            View Full Inquiry
                          </button>
                          <Link
                            href={`/email/compose?to=${msg.sender_email}`}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#10b981',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              textAlign: 'center',
                              textDecoration: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            Reply
                          </Link>
                          {msg.status === 'unread' && (
                            <button
                              onClick={() => handleMarkAs(msg.id, 'read')}
                              style={{
                                padding: '0.5rem 1rem',
                                background: '#2a2a2a',
                                color: '#fff',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                              }}
                            >
                              Mark Read
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: '#fff', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div><strong>Submitted:</strong> {new Date(msg.received_at).toLocaleString()}</div>
                          <div><strong>Form Name:</strong> {msg.form_name || 'N/A'}</div>
                          <div><strong>Email:</strong> {msg.sender_email}</div>
                          {msg.sender_phone && <div><strong>Phone:</strong> {msg.sender_phone}</div>}
                          {msg.sender_ip && <div><strong>IP:</strong> {msg.sender_ip}</div>}
                          {msg.web_page && <div><strong>Page:</strong> {msg.web_page}</div>}
                          <div style={{
                            marginTop: '0.5rem',
                            padding: '0.5rem',
                            background: '#2a2a2a',
                            borderRadius: '4px',
                            fontSize: '0.8rem'
                          }}>
                            {msg.message.substring(0, 150)}{msg.message.length > 150 ? '...' : ''}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: '#888', fontSize: '0.875rem' }}>
                        {msg.internal_notes || 'No notes'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedMessage && (
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
                  Inquiry #{selectedMessage.id.substring(0, 8)}
                </h2>
                <button
                  onClick={() => setSelectedMessage(null)}
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
                <div><strong>From:</strong> {selectedMessage.sender_name || 'N/A'} ({selectedMessage.sender_email})</div>
                <div><strong>Submitted:</strong> {new Date(selectedMessage.received_at).toLocaleString()}</div>
                <div><strong>Form:</strong> {selectedMessage.form_name || 'N/A'}</div>
                {selectedMessage.web_page && <div><strong>Page:</strong> {selectedMessage.web_page}</div>}
                {selectedMessage.sender_phone && <div><strong>Phone:</strong> {selectedMessage.sender_phone}</div>}
                {selectedMessage.sender_ip && <div><strong>IP:</strong> {selectedMessage.sender_ip}</div>}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>Message:</h3>
                <div style={{
                  padding: '1rem',
                  background: '#2a2a2a',
                  borderRadius: '6px',
                  color: '#fff',
                  whiteSpace: 'pre-wrap',
                }}>
                  {selectedMessage.message}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>Internal Notes:</h3>
                <textarea
                  value={internalNote || selectedMessage.internal_notes || ''}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Add an internal note..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '0.75rem',
                    background: '#2a2a2a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                  }}
                />
                <button
                  onClick={handleSaveNote}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
