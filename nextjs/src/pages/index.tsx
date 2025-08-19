// src/pages/admin/categories.tsx
import { useState } from 'react'
import { createClient } from 'next-sanity'
import styles from '../../styles/admincat.module.css'

const client = createClient({
  projectId: '3jc8hsku',
  dataset: 'production',
  apiVersion: '2023-07-30',
  useCdn: false,
})

type Category = {
  _id: string
  title: string
  description?: string
  parent?: { _id: string; title: string }
}

export async function getServerSideProps() {
  const query = `*[_type == "category"]{
    _id,
    title,
    description,
    parent->{ _id, title }
  }`
  const categories: Category[] = await client.fetch(query)
  return { props: { categories } }
}

export default function Categories({ categories }: { categories: Category[] }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [parent, setParent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/categories/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, parent }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed to save category')
      window.location.reload() // reload page to see new category
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Manage Categories</h1>

      {/* Create Form */}
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          className={styles.input}
          type="text"
          placeholder="Category Name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className={styles.textarea}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <select
          className={styles.select}
          value={parent}
          onChange={(e) => setParent(e.target.value)}
        >
          <option value="">No Parent (Top-level)</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.title}
            </option>
          ))}
        </select>
        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? 'Saving...' : 'Create Category'}
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      {/* Existing Categories */}
      <div className={styles.list}>
        <h2 className={styles.subtitle}>Existing Categories</h2>
        <ul>
          {categories.map((cat) => (
            <li key={cat._id} className={styles.item}>
              <span className={styles.catTitle}>{cat.title}</span>
              {cat.parent && <span className={styles.catParent}> → {cat.parent.title}</span>}
              {cat.description && (
                <p className={styles.catDescription}>{cat.description}</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}