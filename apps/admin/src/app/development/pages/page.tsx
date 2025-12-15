'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface DevelopmentPage {
  id: string;
  name: string;
  url: string;
  description: string;
  app: 'golf' | 'web' | 'admin';
  status: 'active' | 'inactive';
  created_at: string;
}

export default function DevelopmentPagesPage() {
  const [pages, setPages] = useState<DevelopmentPage[]>([
    {
      id: '1',
      name: 'Tournaments (New Version)',
      url: '/dev-tournaments',
      description: 'New improved tournaments page with enhanced UI and background system',
      app: 'golf',
      status: 'active',
      created_at: new Date().toISOString()
    }
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPage, setNewPage] = useState({
    name: '',
    url: '',
    description: '',
    app: 'golf' as const,
    status: 'active' as const
  });

  const handleAddPage = () => {
    const page: DevelopmentPage = {
      id: Date.now().toString(),
      ...newPage,
      created_at: new Date().toISOString()
    };
    setPages([...pages, page]);
    setNewPage({ name: '', url: '', description: '', app: 'golf', status: 'active' });
    setShowAddForm(false);
  };

  const handleDeletePage = (id: string) => {
    setPages(pages.filter(p => p.id !== id));
  };

  const getFullUrl = (page: DevelopmentPage) => {
    const baseUrls = {
      golf: 'https://golf.inplay.tv',
      web: 'https://inplay.tv',
      admin: 'http://localhost:3002'
    };
    return `${baseUrls[page.app]}${page.url}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Development Pages</h1>
        <p>Manage development and testing pages across all apps</p>
        <button 
          className={styles.addButton}
          onClick={() => setShowAddForm(true)}
        >
          + Add Development Page
        </button>
      </div>

      {showAddForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Add Development Page</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAddPage(); }}>
              <div className={styles.formGroup}>
                <label>Page Name</label>
                <input
                  type="text"
                  value={newPage.name}
                  onChange={(e) => setNewPage({ ...newPage, name: e.target.value })}
                  placeholder="e.g. New Tournaments Page"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>URL Path</label>
                <input
                  type="text"
                  value={newPage.url}
                  onChange={(e) => setNewPage({ ...newPage, url: e.target.value })}
                  placeholder="e.g. /dev-tournaments"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={newPage.description}
                  onChange={(e) => setNewPage({ ...newPage, description: e.target.value })}
                  placeholder="What is this page for?"
                  rows={3}
                />
              </div>
              <div className={styles.formGroup}>
                <label>App</label>
                <select
                  value={newPage.app}
                  onChange={(e) => setNewPage({ ...newPage, app: e.target.value as 'golf' | 'web' | 'admin' })}
                >
                  <option value="golf">Golf App</option>
                  <option value="web">Web App</option>
                  <option value="admin">Admin App</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Status</label>
                <select
                  value={newPage.status}
                  onChange={(e) => setNewPage({ ...newPage, status: e.target.value as 'active' | 'inactive' })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className={styles.formActions}>
                <button type="button" onClick={() => setShowAddForm(false)} className={styles.cancelButton}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveButton}>
                  Add Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.pagesList}>
        {pages.map((page) => (
          <div key={page.id} className={styles.pageCard}>
            <div className={styles.pageHeader}>
              <div className={styles.pageInfo}>
                <h3>{page.name}</h3>
                <div className={styles.pageDetails}>
                  <span className={`${styles.appBadge} ${styles[page.app]}`}>
                    {page.app.toUpperCase()}
                  </span>
                  <span className={`${styles.statusBadge} ${styles[page.status]}`}>
                    {page.status}
                  </span>
                </div>
              </div>
              <div className={styles.pageActions}>
                <a 
                  href={getFullUrl(page)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.visitButton}
                >
                  Visit Page
                </a>
                <button 
                  onClick={() => handleDeletePage(page.id)}
                  className={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
            
            <div className={styles.pageContent}>
              <div className={styles.urlDisplay}>
                <strong>URL:</strong> 
                <code>{getFullUrl(page)}</code>
                <button 
                  onClick={() => navigator.clipboard.writeText(getFullUrl(page))}
                  className={styles.copyButton}
                  title="Copy URL"
                >
                  📋
                </button>
              </div>
              
              {page.description && (
                <div className={styles.pageDescription}>
                  <strong>Description:</strong> {page.description}
                </div>
              )}
              
              <div className={styles.pageMetadata}>
                <small>Created: {new Date(page.created_at).toLocaleDateString()}</small>
              </div>
            </div>
          </div>
        ))}
      </div>

      {pages.length === 0 && (
        <div className={styles.emptyState}>
          <h3>No development pages</h3>
          <p>Add development pages to track your work in progress.</p>
        </div>
      )}
    </div>
  );
}