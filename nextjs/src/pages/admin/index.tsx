// src/pages/admin/index.tsx
import Link from 'next/link'
import AdminHeader from '@/components/adminHeader'
import styles from '../../styles/adminDashboard.module.css'

export default function AdminDashboard() {
  return (
    <>
      <AdminHeader title="Admin Dashboard" titleHref="/admin" />

      <div className={styles.container}>
        <h1 className={styles.title}>Admin Dashboard</h1>
        <p className={styles.subtitle}>Manage your store with ease</p>

        <div className={styles.grid}>
          <Link href="/admin/products" className={styles.card}>
            <h2>🛍️ Products</h2>
            <p>Create, edit, and manage your products, variants, and inventory.</p>
          </Link>

          <Link href="/admin/categories" className={styles.card}>
            <h2>🗂️ Categories</h2>
            <p>Organize products into categories for easier browsing.</p>
          </Link>

          <Link href="/admin/collections" className={styles.card}>
            <h2>🎯 Collections</h2>
            <p>Curate seasonal or themed collections of products.</p>
          </Link>
        </div>
      </div>
    </>
  )
}