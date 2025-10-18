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
          <Link href="/signup">Get Started</Link>
          <a href="/#how-it-works">How it works</a>
        </div>
      </div>
    </section>
  );
}
