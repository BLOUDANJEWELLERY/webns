'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from '../styles/header.module.css' // You'll create this next
import { collections } from '../data/collections' // Or pass as prop if fetched dynamically

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header className={styles.header}>
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
        <Link href="/" className={styles.brand}>
          Marvello Threads
        </Link>
      </header>

      <aside className={`${styles.sidebar} ${menuOpen ? styles.open : ''}`}>
        <nav className={styles.menu}>
          <button className={styles.closeButton} onClick={() => setMenuOpen(false)}>
            ×
          </button>
          <Link href="/" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link href="/product" onClick={() => setMenuOpen(false)}>All Products</Link>
          {collections.map(col => (
            <Link key={col._id} href={col.linkTarget} onClick={() => setMenuOpen(false)}>
              {col.name}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  )
}