export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <div style={styles.grid}>
          <div style={styles.section}>
            <div style={styles.brand}>
              <span style={styles.icon}>⛳</span>
              <span style={styles.brandName}>InPlay TV</span>
            </div>
            <p style={styles.tagline}>
              The premier fantasy golf platform for competitive players worldwide.
            </p>
          </div>

          <div style={styles.section}>
            <h3 style={styles.heading}>Product</h3>
            <ul style={styles.list}>
              <li><a href="#how-it-works" style={styles.link}>How It Works</a></li>
              <li><a href="/login" style={styles.link}>Tournaments</a></li>
              <li><a href="/login" style={styles.link}>Pricing</a></li>
            </ul>
          </div>

          <div style={styles.section}>
            <h3 style={styles.heading}>Company</h3>
            <ul style={styles.list}>
              <li><a href="#" style={styles.link}>About Us</a></li>
              <li><a href="#" style={styles.link}>Contact</a></li>
              <li><a href="#" style={styles.link}>Careers</a></li>
            </ul>
          </div>

          <div style={styles.section}>
            <h3 style={styles.heading}>Legal</h3>
            <ul style={styles.list}>
              <li><a href="#" style={styles.link}>Terms of Service</a></li>
              <li><a href="#" style={styles.link}>Privacy Policy</a></li>
              <li><a href="#" style={styles.link}>Responsible Gaming</a></li>
            </ul>
          </div>
        </div>

        <div style={styles.bottom}>
          <p style={styles.copyright}>
            © {currentYear} InPlay TV. All rights reserved.
          </p>
          <div style={styles.social}>
            <a href="#" style={styles.socialLink} aria-label="Twitter">𝕏</a>
            <a href="#" style={styles.socialLink} aria-label="Facebook">f</a>
            <a href="#" style={styles.socialLink} aria-label="Instagram">📷</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  footer: {
    background: 'rgba(0,0,0,0.95)',
    color: 'white',
    padding: '60px 20px 30px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '40px',
    marginBottom: '40px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '1.5rem',
    fontWeight: '700',
    marginBottom: '8px',
  },
  icon: {
    fontSize: '24px',
  },
  brandName: {
    background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  tagline: {
    color: 'rgba(255,255,255,0.7)',
    lineHeight: '1.6',
    fontSize: '14px',
  },
  heading: {
    fontSize: '1rem',
    fontWeight: '600',
    marginBottom: '8px',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  link: {
    color: 'rgba(255,255,255,0.7)',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'color 0.2s',
  },
  bottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '30px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    flexWrap: 'wrap',
    gap: '20px',
  },
  copyright: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '14px',
  },
  social: {
    display: 'flex',
    gap: '16px',
  },
  socialLink: {
    color: 'rgba(255,255,255,0.7)',
    textDecoration: 'none',
    fontSize: '18px',
    transition: 'color 0.2s',
  },
};
