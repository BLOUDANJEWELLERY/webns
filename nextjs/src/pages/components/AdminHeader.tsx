'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from '../../styles/header.module.css'

type AdminHeaderProps = {
  title?: string
  titleHref?: string
}

export default function AdminHeader({ title = 'Admin Panel', titleHref = '/admin' }: AdminHeaderProps) {
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

        <Link href={titleHref} className={styles.brand}>
          {title}
        </Link>
      </header>

      <aside className={`${styles.sidebar} ${menuOpen ? styles.open : ''}`}>
        <nav className={styles.menu}>
          <button className={styles.closeButton} onClick={() => setMenuOpen(false)}>
            ×
          </button>
          <Link href="/admin" onClick={() => setMenuOpen(false)}>Dashboard</Link>
          <Link href="/admin/products" onClick={() => setMenuOpen(false)}>Products</Link>
          <Link href="/admin/categories" onClick={() => setMenuOpen(false)}>Categories</Link>
          <Link href="/admin/collections" onClick={() => setMenuOpen(false)}>Collections</Link>
        </nav>
      </aside>
    </>
  )
}