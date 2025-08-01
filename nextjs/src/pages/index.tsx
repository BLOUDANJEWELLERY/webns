// src/pages/index.tsx

import Link from 'next/link'
import styles from '../styles/HomePage.module.css'

export default function Home() {
  return (
    <main className={styles.mainContainer}>
      <h1 className={styles.heading}>Welcome to Bloudan Jewellery</h1>
      <p style={{ textAlign: 'center', marginBottom: '2rem' }}>
        Discover our handcrafted pieces, designed to shine with elegance and timeless beauty.
      </p>
      <div style={{ textAlign: 'center' }}>
        <Link href="/product" className={styles.card}>
          <div className={styles.cardContent}>
            <h2 className={styles.title}>Browse Our Collection →</h2>
          </div>
        </Link>
      </div>
    </main>
  )
}