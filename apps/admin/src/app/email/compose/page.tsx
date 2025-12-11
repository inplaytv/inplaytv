'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Template {
  id: string;
  name: string;
  category: string;
  subject: string;
  content: string;
  variables: string[];
}

function ComposeEmailContent() {
  const searchParams = useSearchParams();
  const toParam = searchParams.get('to');

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [fromName, setFromName] = useState('InPlay Admin');
  const [fromEmail, setFromEmail] = useState('admin');
  const [fromDomain, setFromDomain] = useState('@inplaytv.com');
  const [replyToEmail, setReplyToEmail] = useState('');
  const [useReplyTo, setUseReplyTo] = useState(false);
  const [recipients, setRecipients] = useState<string[]>(toParam ? [toParam] : []);
  const [recipientInput, setRecipientInput] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    setCharCount(content.length);
  }, [content]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/email/templates');
      if (response.ok) {
        const { templates: data } = await response.json();
        setTemplates(data || []);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setSubject(template.subject);
      setContent(template.content);
    }
  };

  const handleAddRecipient = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === 'Tab' || e.key === ',') && recipientInput.trim()) {
      e.preventDefault();
      const email = recipientInput.trim().replace(',', '');
      if (email && !recipients.includes(email) && recipients.length < 5) {
        setRecipients([...recipients, email]);
        setRecipientInput('');
      }
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r !== email));
  };

  const handleSend = async () => {
    if (recipients.length === 0 || !subject.trim() || !content.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSending(true);
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_name: fromName,
          from_email: `${fromEmail}${fromDomain}`,
          reply_to: useReplyTo ? replyToEmail : undefined,
          recipients,
          subject,
          content,
          template_id: selectedTemplate || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      alert('✅ Email sent successfully!');
      // Reset form
      setRecipients([]);
      setSubject('');
      setContent('');
      setSelectedTemplate('');
    } catch (err: any) {
      console.error('Error sending email:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#fff' }}>
            Compose Email
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
          </div>
        </div>

        <div style={{
          background: '#1e1e1e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '2rem',
        }}>
          {/* From Name */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', color: '#fff', fontWeight: 600, marginBottom: '0.5rem' }}>
              From Name
            </label>
            <input
              type="text"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="Example: My Website Name"
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

          {/* Template Selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', color: '#fff', fontWeight: 600, marginBottom: '0.5rem' }}>
              Select a Template
              <span style={{ color: '#888', fontWeight: 400, marginLeft: '0.5rem' }}>
                Optional: select a pre-made email template
              </span>
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateSelect(e.target.value)}
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
              <option value="">None</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.category} - {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* From Email */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', color: '#fff', fontWeight: 600, marginBottom: '0.5rem' }}>
              From Email
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="text"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="admin"
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
              <span style={{ color: '#888' }}>@</span>
              <input
                type="text"
                value={fromDomain.replace('@', '')}
                onChange={(e) => setFromDomain(`@${e.target.value.replace('@', '')}`)}
                placeholder="inplaytv.com"
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
            </div>
          </div>

          {/* Reply-To */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="checkbox"
                checked={useReplyTo}
                onChange={(e) => setUseReplyTo(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ color: '#fff', fontWeight: 600 }}>Use Different Reply-To Address</span>
            </label>
            {useReplyTo && (
              <input
                type="email"
                value={replyToEmail}
                onChange={(e) => setReplyToEmail(e.target.value)}
                placeholder="reply@example.com"
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
            )}
          </div>

          {/* Recipients */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', color: '#fff', fontWeight: 600, marginBottom: '0.5rem' }}>
              Primary Recipients
              <span style={{ color: '#888', fontWeight: 400, marginLeft: '0.5rem' }}>
                Maximum of 5 primary recipients
              </span>
            </label>
            <div style={{
              padding: '0.75rem',
              background: '#2a2a2a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              minHeight: '60px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              alignItems: 'center',
            }}>
              {recipients.map((email) => (
                <span
                  key={email}
                  style={{
                    padding: '0.25rem 0.75rem',
                    background: '#3b82f6',
                    color: '#fff',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {email}
                  <button
                    onClick={() => handleRemoveRecipient(email)}
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
              <input
                type="email"
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                onKeyDown={handleAddRecipient}
                placeholder="comma separated list of recipients, hit ENTER, TAB or Comma to add every email address"
                disabled={recipients.length >= 5}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Subject */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', color: '#fff', fontWeight: 600, marginBottom: '0.5rem' }}>
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email Subject"
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

          {/* Content */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', color: '#fff', fontWeight: 600, marginBottom: '0.5rem' }}>
              Email Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type something"
              style={{
                width: '100%',
                minHeight: '300px',
                padding: '0.75rem',
                background: '#2a2a2a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.875rem',
                resize: 'vertical',
              }}
            />
            <div style={{ marginTop: '0.5rem', color: '#888', fontSize: '0.75rem' }}>
              Characters: {charCount}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowPreview(!showPreview)}
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
              {showPreview ? 'Hide Preview' : 'Preview Email'}
            </button>
            <button
              onClick={handleSend}
              disabled={sending || recipients.length === 0 || !subject || !content}
              style={{
                padding: '0.75rem 1.5rem',
                background: sending || recipients.length === 0 ? '#666' : '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: sending || recipients.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {sending ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div style={{
            marginTop: '2rem',
            background: '#1e1e1e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '2rem',
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', marginBottom: '1rem' }}>
              Email Preview
            </h2>
            <div style={{ marginBottom: '1rem', color: '#888', fontSize: '0.875rem' }}>
              <div><strong>From:</strong> {fromName} &lt;{fromEmail}{fromDomain}&gt;</div>
              <div><strong>To:</strong> {recipients.join(', ')}</div>
              <div><strong>Subject:</strong> {subject}</div>
            </div>
            <div style={{
              padding: '1.5rem',
              background: '#fff',
              borderRadius: '6px',
              color: '#000',
              whiteSpace: 'pre-wrap',
            }}>
              {content}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ComposeEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ComposeEmailContent />
    </Suspense>
  );
}
