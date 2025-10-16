'use client';

export default function FAQ() {
  const faqs = [
    {
      question: 'How does fantasy golf work?',
      answer: 'Select a roster of golfers within a salary cap, earn points based on their real tournament performance, and compete for prizes.',
    },
    {
      question: 'Is it free to play?',
      answer: 'You can join free contests to practice. Paid contests offer real cash prizes and have various entry fee options.',
    },
    {
      question: 'How are winners determined?',
      answer: 'Your team earns points based on golfer performance. Highest scoring teams win prizes according to the contest payout structure.',
    },
    {
      question: 'When do I get paid if I win?',
      answer: 'Winnings are credited to your account once the tournament concludes. Withdraw anytime via secure payment methods.',
    },
  ];

  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Frequently Asked Questions</h2>
          <p style={styles.subtitle}>Everything you need to know to get started</p>
        </div>
        <div style={styles.grid} className="faq-grid">
          {faqs.map((faq, index) => (
            <div key={index} style={styles.card}>
              <h3 style={styles.question}>{faq.question}</h3>
              <p style={styles.answer}>{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .faq-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
        }
        @media (min-width: 768px) {
          .faq-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    padding: '100px 20px',
    background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(0,60,60,0.7))',
    color: 'white',
  },
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '60px',
  },
  title: {
    fontSize: 'clamp(2rem, 4vw, 2.5rem)',
    fontWeight: '700',
    marginBottom: '16px',
  },
  subtitle: {
    fontSize: '1.125rem',
    color: 'rgba(255,255,255,0.7)',
  },
  card: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  question: {
    fontSize: '1.125rem',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#14b8a6',
  },
  answer: {
    color: 'rgba(255,255,255,0.8)',
    lineHeight: '1.6',
  },
};
