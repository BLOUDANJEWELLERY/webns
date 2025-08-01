// src/pages/index.tsx
import Link from 'next/link'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <main className={styles.container}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>Marvello Threads</h1>
          <p className={styles.subtitle}>
            Step into a world where timeless fashion meets modern craftsmanship. Discover pieces made to define your style.
          </p>
          <Link href="/product" className={styles.ctaButton}>
            Browse Collection
          </Link>
        </div>
        <div className={styles.heroImageWrapper}>
          <img
            src="/hero-fashion.jpg"
            alt="Stylish clothing collection"
            className={styles.heroImage}
          />
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.featureCard}>
          <h3>Tailored Quality</h3>
          <p>Premium fabrics and detail-driven design — stitched for confidence.</p>
        </div>
        <div className={styles.featureCard}>
          <h3>Modern Classics</h3>
          <p>From bold fits to minimalist lines, our looks stand the test of time.</p>
        </div>
        <div className={styles.featureCard}>
          <h3>Designed in Kuwait</h3>
          <p>Born in heritage, tailored for today's trendsetters.</p>
        </div>
      </section>
    </main>
  )
}