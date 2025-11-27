import Link from 'next/link';
import styles from '@/app/home.module.css';

export default function Hero() {
  return (
    <section className={styles.wrap}>
      <div className={`${styles.glass} ${styles.hero}`}>
        <h1 className={styles.heroTitle}>
          Experience Golf Like{' '}
          <span>Never Before</span>
        </h1>
        <p className={styles.heroSub}>
          Join thousands of skilled players putting their golf knowledge to the test. 
          Build your team with strategy, compete in live tournaments, and win real prizes through skillful play.
        </p>
        <div className={styles.heroBtns}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <span style={{ 
              opacity: 0.5, 
              cursor: 'not-allowed',
              padding: '0.75rem 2rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              borderRadius: '8px',
              fontWeight: 500,
              display: 'inline-block'
            }}>Get Started</span>
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              background: '#fbbf24',
              color: '#000',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 600
            }}>SOON</span>
          </div>
          <span style={{ 
            opacity: 0.5,
            cursor: 'not-allowed',
            padding: '0.75rem 2rem',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#fff',
            borderRadius: '8px',
            display: 'inline-block'
          }}>How it works</span>
        </div>
      </div>
    </section>
  );
}
