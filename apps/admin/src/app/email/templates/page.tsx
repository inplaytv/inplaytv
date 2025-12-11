'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Template {
  id: string;
  name: string;
  category: string;
  subject: string;
  content: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subject: '',
    content: '',
    variables: [] as string[],
    is_active: true,
  });
  const [variableInput, setVariableInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/email/templates');
      if (response.ok) {
        const { templates: data } = await response.json();
        setTemplates(data || []);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      subject: template.subject,
      content: template.content,
      variables: template.variables,
      is_active: template.is_active,
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      category: '',
      subject: '',
      content: '',
      variables: [],
      is_active: true,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.category || !formData.subject || !formData.content) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const method = editingTemplate ? 'PUT' : 'POST';
      const url = editingTemplate
        ? `/api/email/templates/${editingTemplate.id}`
        : '/api/email/templates';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save template');
      }

      alert(editingTemplate ? '✅ Template updated!' : '✅ Template created!');
      setShowModal(false);
      fetchTemplates();
    } catch (err) {
      console.error('Error saving template:', err);
      alert('❌ Error saving template');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/email/templates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      alert('✅ Template deleted!');
      fetchTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
      alert('❌ Error deleting template');
    }
  };

  const handleToggleActive = async (template: Template) => {
    try {
      const response = await fetch(`/api/email/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...template,
          is_active: !template.is_active,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update template');
      }

      fetchTemplates();
    } catch (err) {
      console.error('Error toggling template status:', err);
      alert('❌ Error updating template');
    }
  };

  const handleDuplicate = async (template: Template) => {
    try {
      const response = await fetch('/api/email/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${template.name} (Copy)`,
          category: template.category,
          subject: template.subject,
          content: template.content,
          variables: template.variables,
          is_active: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate template');
      }

      alert('✅ Template duplicated!');
      fetchTemplates();
    } catch (err) {
      console.error('Error duplicating template:', err);
      alert('❌ Error duplicating template');
    }
  };

  const handleAddVariable = () => {
    if (variableInput.trim() && !formData.variables.includes(variableInput.trim())) {
      setFormData({
        ...formData,
        variables: [...formData.variables, variableInput.trim()],
      });
      setVariableInput('');
    }
  };

  const handleRemoveVariable = (variable: string) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter(v => v !== variable),
    });
  };

  const categories = Array.from(new Set(templates.map(t => t.category)));
  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#fff' }}>
            Email Templates
          </h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link
              href="/email/compose"
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
              ✉️ Compose
            </Link>
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
              + Add Template
            </button>
          </div>
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
            placeholder="Search templates..."
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
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '0.75rem',
              background: '#2a2a2a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.875rem',
            }}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
            Loading templates...
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
            No templates found
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1.5rem',
          }}>
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                style={{
                  background: '#1e1e1e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  position: 'relative',
                }}
              >
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#fff', margin: 0 }}>
                      {template.name}
                    </h3>
                    <button
                      onClick={() => handleToggleActive(template)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        background: template.is_active ? '#10b981' : '#6b7280',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      {template.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  <div style={{ color: '#888', fontSize: '0.875rem' }}>
                    {template.category}
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    Subject:
                  </div>
                  <div style={{ color: '#fff', fontSize: '0.875rem' }}>
                    {template.subject}
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    Preview:
                  </div>
                  <div style={{
                    color: '#ccc',
                    fontSize: '0.875rem',
                    maxHeight: '80px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: '1.5',
                  }}>
                    {template.content.slice(0, 150)}...
                  </div>
                </div>

                {template.variables.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                      Variables:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {template.variables.map((variable) => (
                        <span
                          key={variable}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: '#3b82f6',
                            color: '#fff',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                          }}
                        >
                          {variable}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleEdit(template)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: '#2a2a2a',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDuplicate(template)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: '#2a2a2a',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                    }}
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    style={{
                      padding: '0.5rem',
                      background: '#dc2626',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
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
            maxWidth: '800px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', marginBottom: '1.5rem' }}>
              {editingTemplate ? 'Edit Template' : 'Add New Template'}
            </h2>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', color: '#fff', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Template Name *
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
                  Category *
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Admin, User, Marketing"
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
                  Subject *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
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
                  Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  style={{
                    width: '100%',
                    minHeight: '200px',
                    padding: '0.75rem',
                    background: '#2a2a2a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#fff', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Variables
                  <span style={{ color: '#888', fontWeight: 400, marginLeft: '0.5rem' }}>
                    e.g., %%%email%%%, %%%website_name%%%
                  </span>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    value={variableInput}
                    onChange={(e) => setVariableInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddVariable()}
                    placeholder="%%%variable_name%%%"
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
                    onClick={handleAddVariable}
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
                  {formData.variables.map((variable) => (
                    <span
                      key={variable}
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
                      {variable}
                      <button
                        onClick={() => handleRemoveVariable(variable)}
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

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ color: '#fff', fontWeight: 600 }}>Active</span>
                </label>
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
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
