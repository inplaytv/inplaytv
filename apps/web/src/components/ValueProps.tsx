export default function ValueProps() {
  const features = [
    {
      iconClass: 'fa-bolt',
      title: 'Live Scoring',
      description: 'Real-time updates and live scoring keep you connected to every shot, every hole, every tournament.',
    },
    {
      iconClass: 'fa-users',
      title: 'Community',
      description: 'Join a thriving community of golf enthusiasts and compete with players from around the world.',
    },
    {
      iconClass: 'fa-mobile-alt',
      title: 'Mobile First',
      description: 'Perfectly optimized for mobile devices, play anywhere, anytime with our responsive design.',
    },
    {
      iconClass: 'fa-shield-alt',
      title: 'Secure & Fair',
      description: 'Bank-level security and transparent scoring ensure fair play and protect your investments.',
    },
    {
      iconClass: 'fa-chart-bar',
      title: 'Advanced Analytics',
      description: 'Deep player statistics and performance analytics help you make informed decisions.',
    },
    {
      iconClass: 'fa-gift',
      title: 'Big Prizes',
      description: 'Compete for substantial cash prizes and exclusive rewards in daily and weekly tournaments.',
    },
  ];

  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Why Choose InPlay TV?</h2>
          <p style={styles.subtitle}>Discover what makes us the premier destination for golf fantasy sports</p>
        </div>
        <div style={styles.grid}>
          {features.map((feature, index) => (
            <div key={index} style={styles.card}>
              <div style={styles.icon}>
                <i className={`fas ${feature.iconClass}`}></i>
              </div>
              <h3 style={styles.featureTitle}>{feature.title}</h3>
              <p style={styles.description}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
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
    maxWidth: '1200px',
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '32px',
  },
  card: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '16px',
    padding: '32px',
    border: '1px solid rgba(255,255,255,0.1)',
    transition: 'all 0.3s ease',
    textAlign: 'center',
  },
  icon: {
    fontSize: '3rem',
    color: '#14b8a6',
    marginBottom: '24px',
  },
  featureTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '12px',
  },
  description: {
    color: 'rgba(255,255,255,0.8)',
    lineHeight: '1.6',
  },
};
