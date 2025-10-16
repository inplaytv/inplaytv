import styles from '@/app/home.module.css';

export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: 'Choose Tournament',
      description: 'Browse live tournaments and select the one that matches your style and budget.',
    },
    {
      number: 2,
      title: 'Build Your Team',
      description: 'Draft your fantasy golf team within the salary cap using our player selection tools.',
    },
    {
      number: 3,
      title: 'Watch & Win',
      description: 'Follow live scoring and watch your team compete for real cash prizes.',
    },
  ];

  const inlineStyles: Record<string, React.CSSProperties> = {
    header: {
      textAlign: 'center',
      marginBottom: '3rem',
    },
    title: {
      fontSize: 'clamp(2rem, 4vw, 2.5rem)',
      fontWeight: '700',
      marginBottom: '1rem',
    },
    subtitle: {
      fontSize: '1.125rem',
      color: 'rgba(255,255,255,0.7)',
    },
    card: {
      display: 'flex',
      gap: '1.5rem',
      alignItems: 'flex-start',
    },
    number: {
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.5rem',
      fontWeight: '700',
      flexShrink: 0,
      color: '#fff',
    },
    content: {
      flex: 1,
    },
    stepTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      marginBottom: '0.75rem',
    },
    description: {
      color: 'rgba(255,255,255,0.8)',
      lineHeight: '1.6',
    },
  };

  return (
    <section id="how-it-works" className={styles.wrap}>
      <div className={styles.glass}>
        <div style={inlineStyles.header}>
          <h2 style={inlineStyles.title}>How It Works</h2>
          <p style={inlineStyles.subtitle}>Get started in three simple steps</p>
        </div>
        <div className={styles.grid3}>
          {steps.map((step) => (
            <div key={step.number} style={inlineStyles.card}>
              <div style={inlineStyles.number}>{step.number}</div>
              <div style={inlineStyles.content}>
                <h3 style={inlineStyles.stepTitle}>{step.title}</h3>
                <p style={inlineStyles.description}>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
