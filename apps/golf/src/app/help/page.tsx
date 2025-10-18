'use client';

import RequireAuth from '@/components/RequireAuth';
import Header from '@/components/Header';

export const dynamic = 'force-dynamic';

function HelpPageContent() {
  return (
    <>
      <Header />
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', color: '#fff' }}>
          Help & Support
        </h1>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '2rem',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#fff' }}>
            Get in Touch
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Need assistance? Our support team is here to help with any questions or issues you may have.
          </p>

          <div style={{
            background: 'rgba(102, 126, 234, 0.1)',
            border: '1px solid rgba(102, 126, 234, 0.3)',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>
              Email Support
            </div>
            <a
              href="mailto:support@inplay.tv"
              style={{
                color: '#667eea',
                fontSize: '1rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              support@inplay.tv
            </a>
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#fff' }}>
            Frequently Asked Questions
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <FAQItem
              question="How do I enter a tournament?"
              answer="Browse available tournaments in the Lobby and click 'Enter' to build your team and submit your entry."
            />
            <FAQItem
              question="How does the wallet work?"
              answer="Your wallet holds your account balance. Top up using our secure payment options and use funds to enter tournaments."
            />
            <FAQItem
              question="When are winnings paid out?"
              answer="Winnings are credited to your wallet automatically when tournaments conclude. You can withdraw funds at any time."
            />
            <FAQItem
              question="How do I change my password?"
              answer="Visit the Security page from the user menu to change your password or update account settings."
            />
          </div>
        </div>
      </div>
    </>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '8px',
      padding: '1rem',
    }}>
      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>
        {question}
      </div>
      <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
        {answer}
      </div>
    </div>
  );
}

export default function HelpPage() {
  return (
    <RequireAuth>
      <HelpPageContent />
    </RequireAuth>
  );
}
