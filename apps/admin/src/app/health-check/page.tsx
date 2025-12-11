'use client';

import { useEffect, useState } from 'react';
import styles from './health-check.module.css';

interface HealthIssue {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  affectedEntity?: {
    type: 'tournament' | 'competition';
    id: string;
    name: string;
  };
  suggestedFix?: string;
}

interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  issues: HealthIssue[];
  summary: {
    totalIssues: number;
    criticalIssues: number;
    warningIssues: number;
    infoIssues: number;
  };
}

export default function HealthCheckPage() {
  const [healthData, setHealthData] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchHealthCheck = async () => {
    try {
      setError(null);
      const response = await fetch('/api/health-check', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setHealthData(data);
    } catch (err: any) {
      console.error('Health check failed:', err);
      setError(err.message || 'Failed to fetch health check');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthCheck();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchHealthCheck();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return 'fa-exclamation-circle';
      case 'warning': return 'fa-exclamation-triangle';
      case 'info': return 'fa-info-circle';
      default: return 'fa-question-circle';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Running health check...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <i className="fas fa-exclamation-triangle"></i>
          <h2>Health Check Failed</h2>
          <p>{error}</p>
          <button onClick={fetchHealthCheck} className={styles.retryBtn}>
            <i className="fas fa-redo"></i>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!healthData) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>System Health Check</h1>
          <p className={styles.subtitle}>
            Automated monitoring to catch issues before they become critical problems
          </p>
        </div>
        <div className={styles.headerRight}>
          <button 
            onClick={fetchHealthCheck}
            className={styles.refreshBtn}
          >
            <i className="fas fa-sync-alt"></i>
            Refresh
          </button>
          <label className={styles.autoRefreshToggle}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Auto-refresh (30s)</span>
          </label>
        </div>
      </div>

      {/* Overall Status */}
      <div 
        className={styles.statusCard}
        style={{
          borderLeft: `4px solid ${getStatusColor(healthData.status)}`
        }}
      >
        <div className={styles.statusHeader}>
          <div className={styles.statusIcon} style={{ color: getStatusColor(healthData.status) }}>
            <i className={`fas ${
              healthData.status === 'healthy' ? 'fa-check-circle' :
              healthData.status === 'warning' ? 'fa-exclamation-triangle' :
              'fa-times-circle'
            }`}></i>
          </div>
          <div>
            <h2 style={{ color: getStatusColor(healthData.status) }}>
              {healthData.status.toUpperCase()}
            </h2>
            <p className={styles.timestamp}>
              Last checked: {new Date(healthData.timestamp).toLocaleString()}
            </p>
          </div>
        </div>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <div className={styles.summaryValue}>{healthData.summary.totalIssues}</div>
            <div className={styles.summaryLabel}>Total Issues</div>
          </div>
          <div className={styles.summaryItem}>
            <div className={styles.summaryValue} style={{ color: '#ef4444' }}>
              {healthData.summary.criticalIssues}
            </div>
            <div className={styles.summaryLabel}>Critical</div>
          </div>
          <div className={styles.summaryItem}>
            <div className={styles.summaryValue} style={{ color: '#f59e0b' }}>
              {healthData.summary.warningIssues}
            </div>
            <div className={styles.summaryLabel}>Warnings</div>
          </div>
          <div className={styles.summaryItem}>
            <div className={styles.summaryValue} style={{ color: '#3b82f6' }}>
              {healthData.summary.infoIssues}
            </div>
            <div className={styles.summaryLabel}>Info</div>
          </div>
        </div>
      </div>

      {/* Issues List */}
      {healthData.issues.length === 0 ? (
        <div className={styles.noIssues}>
          <i className="fas fa-check-circle"></i>
          <h3>All Systems Operational</h3>
          <p>No issues detected. Everything is running smoothly!</p>
        </div>
      ) : (
        <div className={styles.issuesList}>
          <h2>Detected Issues</h2>
          {healthData.issues.map((issue, index) => (
            <div 
              key={index}
              className={styles.issueCard}
              style={{
                borderLeft: `4px solid ${getSeverityColor(issue.severity)}`
              }}
            >
              <div className={styles.issueHeader}>
                <div className={styles.issueIcon} style={{ color: getSeverityColor(issue.severity) }}>
                  <i className={`fas ${getSeverityIcon(issue.severity)}`}></i>
                </div>
                <div className={styles.issueHeaderText}>
                  <span 
                    className={styles.issueSeverity}
                    style={{ 
                      background: getSeverityColor(issue.severity),
                      color: '#fff'
                    }}
                  >
                    {issue.severity.toUpperCase()}
                  </span>
                  <span className={styles.issueCategory}>{issue.category}</span>
                </div>
              </div>

              <div className={styles.issueBody}>
                <p className={styles.issueMessage}>{issue.message}</p>
                
                {issue.affectedEntity && (
                  <div className={styles.affectedEntity}>
                    <i className={`fas ${
                      issue.affectedEntity.type === 'tournament' ? 'fa-trophy' : 'fa-layer-group'
                    }`}></i>
                    <span>
                      {issue.affectedEntity.type === 'tournament' ? 'Tournament' : 'Competition'}:
                      {' '}<strong>{issue.affectedEntity.name}</strong>
                    </span>
                  </div>
                )}

                {issue.suggestedFix && (
                  <div className={styles.suggestedFix}>
                    <div className={styles.fixHeader}>
                      <i className="fas fa-wrench"></i>
                      <strong>Suggested Fix:</strong>
                    </div>
                    <code className={styles.fixCode}>{issue.suggestedFix}</code>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* System Architecture Notes */}
      <div className={styles.architectureNotes}>
        <h2>
          <i className="fas fa-info-circle"></i>
          System Architecture Notes
        </h2>
        <div className={styles.notesList}>
          <div className={styles.note}>
            <strong>Tournament Status ≠ Competition Registration Status</strong>
            <p>
              A tournament can be "live" (in progress) while competitions are still accepting 
              registrations. Competition registration is ONLY determined by <code>competition.reg_close_at</code>, 
              not by tournament status.
            </p>
          </div>
          <div className={styles.note}>
            <strong>Multiple Registration Date Columns</strong>
            <p>
              Tournaments have 6 different registration date columns. This creates confusion. 
              Recommend consolidating to just <code>reg_open_at</code> and <code>reg_close_at</code>.
            </p>
          </div>
          <div className={styles.note}>
            <strong>Automated Status Updates</strong>
            <p>
              Tournament statuses update automatically via cron job. Competition statuses require 
              manual SQL updates. This discrepancy can cause misalignment issues.
            </p>
          </div>
          <div className={styles.note}>
            <strong>Frontend Filter Requirements</strong>
            <p>
              Frontend filters must check for BOTH <code>'reg_open'</code> AND <code>'live'</code> statuses
              to display active tournaments. Missing either check causes tournaments to disappear.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
