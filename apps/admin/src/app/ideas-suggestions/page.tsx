'use client';

import { useEffect, useState } from 'react';
import RequireAdmin from '@/components/RequireAdmin';
import styles from './ideas-suggestions.module.css';

interface Idea {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'idea' | 'considering' | 'approved' | 'rejected' | 'implemented';
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  implemented_at: string | null;
}

export default function IdeasSuggestionsPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [expandedIdeas, setExpandedIdeas] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'feature',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    status: 'idea' as 'idea' | 'considering' | 'approved' | 'rejected' | 'implemented',
  });

  useEffect(() => {
    fetchIdeas();
  }, []);

  async function fetchIdeas() {
    try {
      console.log('🔄 Fetching ideas...');
      const res = await fetch('/api/ideas-suggestions');
      const data = await res.json();
      console.log('📦 Received data:', data);
      if (data.error) {
        console.error('❌ API Error:', data.error);
        alert('Error: ' + data.error);
      }
      setIdeas(data.ideas || []);
    } catch (error) {
      console.error('❌ Error fetching ideas:', error);
      alert('Failed to fetch ideas. Check console for details.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      console.log('💾 Submitting form:', formData);
      let response;
      
      if (editingIdea) {
        // Update existing idea
        response = await fetch(`/api/ideas-suggestions/${editingIdea.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        // Create new idea
        response = await fetch('/api/ideas-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      const result = await response.json();
      console.log('📬 Response:', result);
      
      if (result.error) {
        console.error('❌ Submission error:', result.error);
        alert('Error: ' + result.error);
        return;
      }

      console.log('✅ Idea saved successfully');

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'feature',
        priority: 'medium',
        status: 'idea',
      });
      setShowForm(false);
      setEditingIdea(null);
      fetchIdeas();
    } catch (error) {
      console.error('Error saving idea:', error);
    }
  }

  async function toggleApprove(idea: Idea) {
    try {
      await fetch(`/api/ideas-suggestions/${idea.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_approved: !idea.is_approved }),
      });
      fetchIdeas();
    } catch (error) {
      console.error('Error toggling idea:', error);
    }
  }

  async function deleteIdea(id: string) {
    if (!confirm('Delete this idea?')) return;
    
    try {
      await fetch(`/api/ideas-suggestions/${id}`, { method: 'DELETE' });
      fetchIdeas();
    } catch (error) {
      console.error('Error deleting idea:', error);
    }
  }

  function startEdit(idea: Idea) {
    setEditingIdea(idea);
    setFormData({
      title: idea.title,
      description: idea.description || '',
      category: idea.category,
      priority: idea.priority,
      status: idea.status,
    });
    setShowForm(true);
  }

  function toggleExpand(ideaId: string) {
    setExpandedIdeas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ideaId)) {
        newSet.delete(ideaId);
      } else {
        newSet.add(ideaId);
      }
      return newSet;
    });
  }

  const priorityColors = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
  };

  const statusColors = {
    idea: '#6b7280',
    considering: '#3b82f6',
    approved: '#10b981',
    rejected: '#ef4444',
    implemented: '#8b5cf6',
  };

  const categoryIcons: Record<string, string> = {
    feature: '✨',
    improvement: '🚀',
    ui: '🎨',
    performance: '⚡',
    integration: '🔗',
    other: '💡',
  };

  return (
    <RequireAdmin>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Ideas & Suggestions</h1>
            <p className={styles.subtitle}>Capture and track feature ideas, improvements, and suggestions</p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingIdea(null);
              setFormData({
                title: '',
                description: '',
                category: 'feature',
                priority: 'medium',
                status: 'idea',
              });
            }}
            className={styles.addBtn}
          >
            {showForm ? '✕ Cancel' : '+ Add Idea'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Brief description of the idea"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="feature">Feature</option>
                    <option value="improvement">Improvement</option>
                    <option value="ui">UI/UX</option>
                    <option value="performance">Performance</option>
                    <option value="integration">Integration</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <option value="idea">Idea</option>
                    <option value="considering">Considering</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="implemented">Implemented</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Detailed explanation, use cases, benefits..."
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.saveBtn}>
                {editingIdea ? 'Update Idea' : 'Create Idea'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className={styles.loading}>Loading ideas...</div>
        ) : (
          <div className={styles.ideasList}>
            {ideas.length === 0 ? (
              <div className={styles.empty}>
                <p>No ideas yet. Click "Add Idea" to create your first suggestion.</p>
              </div>
            ) : (
              ideas.map((idea) => {
                const isExpanded = expandedIdeas.has(idea.id);
                return (
                  <div
                    key={idea.id}
                    className={`${styles.ideaCard} ${idea.is_approved ? styles.approved : ''}`}
                    style={{ borderLeftColor: priorityColors[idea.priority] }}
                  >
                    <div className={styles.ideaHeader} onClick={() => toggleExpand(idea.id)}>
                      <input
                        type="checkbox"
                        checked={idea.is_approved}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleApprove(idea);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={styles.checkbox}
                        title="Mark as approved"
                      />
                      <div className={styles.ideaTitleRow}>
                        <h3 className={styles.ideaTitle}>
                          {categoryIcons[idea.category] || '💡'} {idea.title}
                        </h3>
                        <div className={styles.ideaMeta}>
                          <span className={styles.badge} style={{ background: priorityColors[idea.priority] }}>
                            {idea.priority}
                          </span>
                          <span className={styles.badge} style={{ background: statusColors[idea.status] }}>
                            {idea.status}
                          </span>
                          <span className={styles.expandIcon}>
                            {isExpanded ? '▼' : '▶'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <>
                        {idea.description && (
                          <p className={styles.ideaDescription}>{idea.description}</p>
                        )}

                        <div className={styles.ideaFooter}>
                          <span className={styles.ideaDate}>
                            Created {new Date(idea.created_at).toLocaleDateString()}
                            {idea.implemented_at && (
                              <> • Implemented {new Date(idea.implemented_at).toLocaleDateString()}</>
                            )}
                          </span>
                          <div className={styles.ideaActions}>
                            <button onClick={(e) => { e.stopPropagation(); startEdit(idea); }} className={styles.editBtn}>
                              Edit
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); deleteIdea(idea.id); }} className={styles.deleteBtn}>
                              Delete
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </RequireAdmin>
  );
}
