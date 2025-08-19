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
  parent?: { _id: string; title: string }
}

export async function getServerSideProps() {
  const query = `*[_type == "category"]{ _id, title, parent->{ _id, title } }`
  const categories: Category[] = await client.fetch(query)
  return { props: { categories } }
}

// Build hierarchy (parent/child tree)
function buildTree(categories: Category[], parentId: string | null = null) {
  return categories
    .filter((cat) => (parentId ? cat.parent?._id === parentId : !cat.parent))
    .map((cat) => ({
      ...cat,
      children: buildTree(categories, cat._id),
    }))
}

export default function Categories({ categories }: { categories: Category[] }) {
  const [newCategory, setNewCategory] = useState<{ parent: string | null; title: string }>({
    parent: null,
    title: '',
  })
  const [editing, setEditing] = useState<{ id: string; title: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const tree = buildTree(categories)

  // Create category
  const handleCreate = async (parent: string | null) => {
    if (!newCategory.title.trim()) return
    setLoading(true)
    try {
      await fetch('/api/categories/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newCategory.title,
          parent,
        }),
      })
      window.location.reload()
    } finally {
      setLoading(false)
      setNewCategory({ parent: null, title: '' })
    }
  }

  // Update category
  const handleUpdate = async (id: string, title: string) => {
    if (!title.trim()) return
    setLoading(true)
    try {
      await fetch(`/api/categories/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title }),
      })
      window.location.reload()
    } finally {
      setLoading(false)
      setEditing(null)
    }
  }

  // Delete category
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return
    setLoading(true)
    try {
      await fetch(`/api/categories/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      window.location.reload()
    } finally {
      setLoading(false)
    }
  }

  // Recursive UI
  const renderTree = (nodes: any[], parent: string | null = null) => (
    <ul className={styles.tree}>
      {nodes.map((node) => (
        <li key={node._id}>
          {editing?.id === node._id ? (
            <div className={styles.inlineForm}>
              <input
                className={styles.input}
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              />
              <button onClick={() => handleUpdate(node._id, editing.title)}>Save</button>
              <button onClick={() => setEditing(null)}>Cancel</button>
            </div>
          ) : (
            <div className={styles.node}>
              <span>{node.title}</span>
              <div className={styles.actions}>
                <button onClick={() => setEditing({ id: node._id, title: node.title })}>
                  ✏️
                </button>
                <button onClick={() => handleDelete(node._id)}>🗑</button>
                <button onClick={() => setNewCategory({ parent: node._id, title: '' })}>
                  ➕
                </button>
              </div>
            </div>
          )}

          {newCategory.parent === node._id && (
            <div className={styles.inlineForm}>
              <input
                className={styles.input}
                placeholder="New subcategory"
                value={newCategory.title}
                onChange={(e) => setNewCategory({ ...newCategory, title: e.target.value })}
              />
              <button onClick={() => handleCreate(node._id)}>Add</button>
              <button onClick={() => setNewCategory({ parent: null, title: '' })}>Cancel</button>
            </div>
          )}

          {node.children?.length > 0 && renderTree(node.children, node._id)}
        </li>
      ))}

      {parent === null && newCategory.parent === null && (
        <div className={styles.inlineForm}>
          <input
            className={styles.input}
            placeholder="New top-level category"
            value={newCategory.title}
            onChange={(e) => setNewCategory({ parent: null, title: e.target.value })}
          />
          <button onClick={() => handleCreate(null)}>Add</button>
        </div>
      )}
    </ul>
  )

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Category Manager</h1>
      {renderTree(tree)}
      {loading && <p className={styles.loading}>Working...</p>}
    </div>
  )
}