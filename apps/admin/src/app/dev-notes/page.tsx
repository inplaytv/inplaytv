'use client';

import { useEffect, useState } from 'react';
import RequireAdmin from '@/components/RequireAdmin';
import styles from './dev-notes.module.css';

interface DevNote {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'deferred';
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export default function DevNotesPage() {
  const [notes, setNotes] = useState<DevNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<DevNote | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'deferred',
  });

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    try {
      const res = await fetch('/api/dev-notes');
      const data = await res.json();
      setNotes(data.notes || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      if (editingNote) {
        // Update existing note
        await fetch(`/api/dev-notes/${editingNote.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        // Create new note
        await fetch('/api/dev-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'general',
        priority: 'medium',
        status: 'pending',
      });
      setShowForm(false);
      setEditingNote(null);
      fetchNotes();
    } catch (error) {
      console.error('Error saving note:', error);
    }
  }

  async function toggleComplete(note: DevNote) {
    try {
      await fetch(`/api/dev-notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: !note.is_completed }),
      });
      fetchNotes();
    } catch (error) {
      console.error('Error toggling note:', error);
    }
  }

  async function deleteNote(id: string) {
    if (!confirm('Delete this note?')) return;
    
    try {
      await fetch(`/api/dev-notes/${id}`, { method: 'DELETE' });
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  }

  function startEdit(note: DevNote) {
    setEditingNote(note);
    setFormData({
      title: note.title,
      description: note.description || '',
      category: note.category,
      priority: note.priority,
      status: note.status,
    });
    setShowForm(true);
  }

  function toggleExpand(noteId: string) {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
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

  const categoryIcons: Record<string, string> = {
    security: '🔒',
    bug: '🐛',
    feature: '✨',
    general: '📝',
    database: '🗄️',
    ui: '🎨',
  };

  return (
    <RequireAdmin>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Dev Notes & Tasks</h1>
            <p className={styles.subtitle}>Track important reminders, TODOs, and technical debt</p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingNote(null);
              setFormData({
                title: '',
                description: '',
                category: 'general',
                priority: 'medium',
                status: 'pending',
              });
            }}
            className={styles.addBtn}
          >
            {showForm ? '✕ Cancel' : '+ Add Note'}
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
                  placeholder="Brief task description"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="general">General</option>
                    <option value="security">Security</option>
                    <option value="bug">Bug</option>
                    <option value="feature">Feature</option>
                    <option value="database">Database</option>
                    <option value="ui">UI/UX</option>
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
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="deferred">Deferred</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Detailed information, steps, or context..."
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.saveBtn}>
                {editingNote ? 'Update Note' : 'Create Note'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className={styles.loading}>Loading notes...</div>
        ) : (
          <div className={styles.notesList}>
            {notes.length === 0 ? (
              <div className={styles.empty}>
                <p>No notes yet. Click "Add Note" to create your first task reminder.</p>
              </div>
            ) : (
              notes.map((note) => {
                const isExpanded = expandedNotes.has(note.id);
                return (
                  <div
                    key={note.id}
                    className={`${styles.noteCard} ${note.is_completed ? styles.completed : ''}`}
                    style={{ borderLeftColor: priorityColors[note.priority] }}
                  >
                    <div className={styles.noteHeader} onClick={() => toggleExpand(note.id)}>
                      <input
                        type="checkbox"
                        checked={note.is_completed}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleComplete(note);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={styles.checkbox}
                      />
                      <div className={styles.noteTitleRow}>
                        <h3 className={styles.noteTitle}>
                          {categoryIcons[note.category] || '📝'} {note.title}
                        </h3>
                        <div className={styles.noteMeta}>
                          <span className={styles.badge} style={{ background: priorityColors[note.priority] }}>
                            {note.priority}
                          </span>
                          <span className={styles.badge}>{note.status.replace('_', ' ')}</span>
                          <span className={styles.expandIcon}>
                            {isExpanded ? '▼' : '▶'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <>
                        {note.description && (
                          <p className={styles.noteDescription}>{note.description}</p>
                        )}

                        <div className={styles.noteFooter}>
                          <span className={styles.noteDate}>
                            Created {new Date(note.created_at).toLocaleDateString()}
                          </span>
                          <div className={styles.noteActions}>
                            <button onClick={(e) => { e.stopPropagation(); startEdit(note); }} className={styles.editBtn}>
                              Edit
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }} className={styles.deleteBtn}>
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
