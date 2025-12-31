'use client';

import { useState } from 'react';
import styles from './email-test.module.css';

export default function EmailTestPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [sending, setSending] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendResult, setSendResult] = useState<any>(null);

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/email/test-connection');
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ success: false, error: 'Failed to test connection' });
    } finally {
      setTesting(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      alert('Please enter an email address');
      return;
    }

    setSending(true);
    setSendResult(null);
    
    try {
      const response = await fetch('/api/email/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmail }),
      });
      const data = await response.json();
      setSendResult(data);
    } catch (error) {
      setSendResult({ success: false, error: 'Failed to send test email' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Email System Test</h1>
        <p>Test your Bluehost SMTP email configuration</p>
      </div>

      <div className={styles.card}>
        <h2>📧 SMTP Configuration</h2>
        <div className={styles.configGrid}>
          <div className={styles.configItem}>
            <span className={styles.label}>Server:</span>
            <span className={styles.value}>mail.inplay.tv</span>
          </div>
          <div className={styles.configItem}>
            <span className={styles.label}>Port:</span>
            <span className={styles.value}>465 (SSL)</span>
          </div>
          <div className={styles.configItem}>
            <span className={styles.label}>Email:</span>
            <span className={styles.value}>admin@inplay.tv</span>
          </div>
          <div className={styles.configItem}>
            <span className={styles.label}>Provider:</span>
            <span className={styles.value}>Bluehost</span>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h2>🔌 Connection Test</h2>
        <p>Verify your SMTP server connection</p>
        
        <button 
          onClick={testConnection} 
          disabled={testing}
          className={styles.button}
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </button>

        {testResult && (
          <div className={testResult.success ? styles.success : styles.error}>
            <strong>{testResult.success ? '✅ Success' : '❌ Failed'}</strong>
            <p>{testResult.message || testResult.error}</p>
            {testResult.details && (
              <pre className={styles.details}>{JSON.stringify(testResult.details, null, 2)}</pre>
            )}
          </div>
        )}
      </div>

      <div className={styles.card}>
        <h2>📨 Send Test Email</h2>
        <p>Send a test email to verify everything works end-to-end</p>
        
        <div className={styles.inputGroup}>
          <input
            type="email"
            placeholder="recipient@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className={styles.input}
          />
          <button 
            onClick={sendTestEmail} 
            disabled={sending || !testEmail}
            className={styles.button}
          >
            {sending ? 'Sending...' : 'Send Test Email'}
          </button>
        </div>

        {sendResult && (
          <div className={sendResult.success ? styles.success : styles.error}>
            <strong>{sendResult.success ? '✅ Email Sent' : '❌ Failed'}</strong>
            <p>{sendResult.message || sendResult.error}</p>
            {sendResult.messageId && (
              <p className={styles.messageId}>Message ID: {sendResult.messageId}</p>
            )}
          </div>
        )}
      </div>

      <div className={styles.card}>
        <h2>🛡️ DNS Records Check</h2>
        <p>Verify your DNS records are properly configured in Vercel</p>
        
        <div className={styles.dnsInfo}>
          <h3>Required DNS Records:</h3>
          <ul>
            <li>
              <strong>SPF Record:</strong> TXT record with value<br/>
              <code>v=spf1 include:_spf.inplay.tv ~all</code>
            </li>
            <li>
              <strong>DKIM Record:</strong> TXT record at selector._domainkey.inplay.tv<br/>
              <small>(Should be provided by Bluehost)</small>
            </li>
            <li>
              <strong>DMARC Record:</strong> TXT record at _dmarc.inplay.tv<br/>
              <code>v=DMARC1; p=quarantine; rua=mailto:admin@inplay.tv</code>
            </li>
            <li>
              <strong>MX Records:</strong> Point to Bluehost mail servers<br/>
              <small>(Already configured through Bluehost)</small>
            </li>
          </ul>
          
          <div className={styles.warning}>
            <strong>⚠️ Note:</strong> DNS changes can take 24-48 hours to fully propagate.
            If connection test passes but emails aren't being delivered, wait for DNS propagation.
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h2>📋 Troubleshooting</h2>
        <div className={styles.troubleshooting}>
          <details>
            <summary>Connection test fails</summary>
            <ul>
              <li>Verify SMTP credentials in .env.local</li>
              <li>Check Bluehost email account is active</li>
              <li>Confirm firewall allows port 465 outbound</li>
              <li>Try port 587 with STARTTLS instead</li>
            </ul>
          </details>
          
          <details>
            <summary>Email sends but doesn't arrive</summary>
            <ul>
              <li>Check recipient's spam folder</li>
              <li>Verify DNS records in Vercel dashboard</li>
              <li>Wait 24-48 hours for DNS propagation</li>
              <li>Test with different email providers (Gmail, Yahoo, etc.)</li>
            </ul>
          </details>
          
          <details>
            <summary>Email arrives in spam</summary>
            <ul>
              <li>Ensure SPF, DKIM, and DMARC records are set up</li>
              <li>Use MXToolbox to check email authentication</li>
              <li>Send from your domain (admin@inplay.tv), not generic addresses</li>
              <li>Avoid spam trigger words in subject/body</li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
}
