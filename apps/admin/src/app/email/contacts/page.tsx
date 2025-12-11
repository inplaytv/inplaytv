'use client';

import { useState, useEffect } from 'react';

interface Contact {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  company: string | null;
  tags: string[];
  status: string;
  forms_submitted: number;
  emails_sent: number;
  last_contact: string | null;
  created_at: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    company: '',
    tags: [] as string[],
    status: 'active',
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/email/contacts');
      if (response.ok) {
        const { contacts: data } = await response.json();
        setContacts(data || []);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      email: contact.email,
      name: contact.name || '',
      phone: contact.phone || '',
      company: contact.company || '',
      tags: contact.tags,
      status: contact.status,
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingContact(null);
    setFormData({
      email: '',
      name: '',
      phone: '',
      company: '',
      tags: [],
      status: 'active',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.email) {
      alert('Email is required');
      return;
    }

    try {
      const method = editingContact ? 'PUT' : 'POST';
      const url = editingContact
        ? `/api/email/contacts/${editingContact.id}`
        : '/api/email/contacts';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save contact');
      }

      alert(editingContact ? '✅ Contact updated!' : '✅ Contact added!');
      setShowModal(false);
      fetchContacts();
    } catch (err) {
      console.error('Error saving contact:', err);
      alert('❌ Error saving contact');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      const response = await fetch(`/api/email/contacts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete contact');
      }

      alert('✅ Contact deleted!');
      fetchContacts();
    } catch (err) {
      console.error('Error deleting contact:', err);
      alert('❌ Error deleting contact');
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag),
    });
  };

  const allTags = Array.from(new Set(contacts.flatMap(c => c.tags)));
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (contact.name && contact.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
    const matchesTag = tagFilter === 'all' || contact.tags.includes(tagFilter);
    return matchesSearch && matchesStatus && matchesTag;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'bounced': return '#dc2626';
      case 'unsubscribed': return '#6b7280';
      default: return '#888';
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#fff' }}>
            Contacts
          </h1>
          <button
            onClick={handleAddNew}
            style={{
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
            + Add Contact
          </button>
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}>
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '0.75rem',
              background: '#2a2a2a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.875rem',
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.75rem',
              background: '#2a2a2a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.875rem',
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="bounced">Bounced</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            style={{
              padding: '0.75rem',
              background: '#2a2a2a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.875rem',
            }}
          >
            <option value="all">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{
            background: '#1e1e1e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '1.5rem',
          }}>
            <div style={{ color: '#888', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Total Contacts
            </div>
            <div style={{ color: '#fff', fontSize: '2rem', fontWeight: 700 }}>
              {contacts.length}
            </div>
          </div>
          <div style={{
            background: '#1e1e1e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '1.5rem',
          }}>
            <div style={{ color: '#888', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Active
            </div>
            <div style={{ color: '#10b981', fontSize: '2rem', fontWeight: 700 }}>
              {contacts.filter(c => c.status === 'active').length}
            </div>
          </div>
          <div style={{
            background: '#1e1e1e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '1.5rem',
          }}>
            <div style={{ color: '#888', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Bounced
            </div>
            <div style={{ color: '#dc2626', fontSize: '2rem', fontWeight: 700 }}>
              {contacts.filter(c => c.status === 'bounced').length}
            </div>
          </div>
        </div>

        {/* Contacts Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
            Loading contacts...
          </div>
        ) : filteredContacts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
            No contacts found
          </div>
        ) : (
          <div style={{
            background: '#1e1e1e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#2a2a2a' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontSize: '0.875rem', fontWeight: 600 }}>
                      Contact
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontSize: '0.875rem', fontWeight: 600 }}>
                      Status
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontSize: '0.875rem', fontWeight: 600 }}>
                      Tags
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'center', color: '#888', fontSize: '0.875rem', fontWeight: 600 }}>
                      Forms
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'center', color: '#888', fontSize: '0.875rem', fontWeight: 600 }}>
                      Emails
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontSize: '0.875rem', fontWeight: 600 }}>
                      Last Contact
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'right', color: '#888', fontSize: '0.875rem', fontWeight: 600 }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact) => (
                    <tr key={contact.id} style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{ color: '#fff', fontWeight: 600, marginBottom: '0.25rem' }}>
                            {contact.name || 'No name'}
                          </div>
                          <div style={{ color: '#888', fontSize: '0.875rem' }}>
                            {contact.email}
                          </div>
                          {contact.company && (
                            <div style={{ color: '#888', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                              {contact.company}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          background: getStatusColor(contact.status),
                          color: '#fff',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                        }}>
                          {contact.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {contact.tags.map((tag) => (
                            <span
                              key={tag}
                              style={{
                                padding: '0.25rem 0.5rem',
                                background: '#3b82f6',
                                color: '#fff',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', color: '#fff' }}>
                        {contact.forms_submitted}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', color: '#fff' }}>
                        {contact.emails_sent}
                      </td>
                      <td style={{ padding: '1rem', color: '#888', fontSize: '0.875rem' }}>
                        {contact.last_contact
                          ? new Date(contact.last_contact).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleEdit(contact)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#2a2a2a',
                              color: '#fff',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(contact.id)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#dc2626',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
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
        }}>
          <div style={{
            background: '#1e1e1e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', marginBottom: '1.5rem' }}>
              {editingContact ? 'Edit Contact' : 'Add New Contact'}
            </h2>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', color: '#fff', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#2a2a2a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#fff', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#2a2a2a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#fff', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#2a2a2a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#fff', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#2a2a2a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#fff', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#2a2a2a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="active">Active</option>
                  <option value="bounced">Bounced</option>
                  <option value="unsubscribed">Unsubscribed</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#fff', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Tags
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="Add tag"
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: '#2a2a2a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.875rem',
                    }}
                  />
                  <button
                    onClick={handleAddTag}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#3b82f6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                    }}
                  >
                    Add
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: '#3b82f6',
                        color: '#fff',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#fff',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: '1rem',
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#2a2a2a',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
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
                Save Contact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
