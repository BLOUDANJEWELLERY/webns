import Link from 'next/link'
import styles from '../../styles/header.module.css'

export default function AdminHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link href="/admin">🛠 Admin Panel</Link>
      </div>
      <nav className={styles.nav}>
        <Link href="/admin/products">Products</Link>
        <Link href="/admin/categories">Categories</Link>
        <Link href="/admin/collections">Collections</Link>
      </nav>
    </header>
  )
}