export default function CTA() {
  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <div style={styles.content}>
          <h2 style={styles.title}>Ready to Start Winning?</h2>
          <p style={styles.description}>
            Join thousands of players competing for over £100,000 in weekly prizes
          </p>
          <div style={styles.buttons}>
            <a href="/login" style={{...styles.btn, ...styles.btnPrimary}}>
              <span>👤</span>
              <span>Sign Up Free</span>
            </a>
            <a href="#how-it-works" style={{...styles.btn, ...styles.btnSecondary}}>
              <span>👁️</span>
              <span>Learn How</span>
            </a>
          </div>
        </div>
        <div style={styles.visual}>
          <div style={styles.prizeDisplay}>
            <div style={styles.prizeAmount}>£100,000+</div>
            <div style={styles.prizeLabel}>Weekly Prizes</div>
          </div>
        </div>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    padding: '120px 20px',
    background: 'linear-gradient(135deg, rgba(0,0,0,0.85), rgba(0,50,50,0.7))',
    color: 'white',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '60px',
    alignItems: 'center',
  },
  content: {
    maxWidth: '600px',
  },
  title: {
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: '700',
    marginBottom: '24px',
  },
  description: {
    fontSize: '1.25rem',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: '40px',
    lineHeight: '1.6',
  },
  buttons: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '16px 32px',
    borderRadius: '12px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    border: 'none',
    cursor: 'pointer',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
    color: '#000',
    boxShadow: '0 8px 32px rgba(20,184,166,0.3)',
  },
  btnSecondary: {
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  visual: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prizeDisplay: {
    background: 'rgba(20,184,166,0.1)',
    border: '2px solid #14b8a6',
    borderRadius: '20px',
    padding: '40px 60px',
    textAlign: 'center',
  },
  prizeAmount: {
    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '8px',
  },
  prizeLabel: {
    fontSize: '1.25rem',
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
};
