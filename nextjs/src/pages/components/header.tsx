// src/components/header.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from '../../styles/header.module.css'
import { useCart } from '@/context/CartContext'

type Collection = {
  _id: string
  name: string
  linkTarget: string
}

type HeaderProps = {
  collections?: Collection[]
  title?: string
  titleHref?: string
}

export default function Header({ collections = [], title = 'Marvello Threads', titleHref = '/' }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { cart } = useCart()

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

        <Link href="/cart" className={styles.cartIcon}>
          🛒
          {cart.length > 0 && (
            <span className={styles.cartCount}>{cart.length}</span>
          )}
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
            <Link
              key={col._id}
              href={col.linkTarget}
              onClick={() => setMenuOpen(false)}
            >
              {col.name}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  )
}