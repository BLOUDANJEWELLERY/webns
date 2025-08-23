// src/pages/admin/categories.tsx
import { useState, useMemo } from 'react'
import styles from '../../styles/admincat.module.css'
import { arrayMoveImmutable } from 'array-move'

// -------------------- Types --------------------
interface CategoryRaw {
  _id: string
  title: string
  parent?: { _id: string; title: string }
  order?: number
}

interface CategoryNode extends CategoryRaw {
  children: CategoryNode[]
}

// -------------------- Helper: Build Tree --------------------
const buildCategoryTree = (categories: CategoryRaw[]): CategoryNode[] => {
  const map: Record<string, CategoryNode> = {}
  const roots: CategoryNode[] = []

  categories.forEach(cat => {
    map[cat._id] = { ...cat, children: [] }
  })

  categories.forEach(cat => {
    if (cat.parent?._id && map[cat.parent._id]) {
      map[cat.parent._id].children.push(map[cat._id])
    } else {
      roots.push(map[cat._id])
    }
  })

  const sortTree = (nodes: CategoryNode[]) => {
    nodes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    nodes.forEach(n => sortTree(n.children))
  }

  sortTree(roots)
  return roots
}

// -------------------- Main Page --------------------
export default function CategoryManagerPage({ categories: initialCategories }: { categories: CategoryRaw[] }) {
  const [categories, setCategories] = useState<CategoryRaw[]>(initialCategories)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string[]>([])
  const [inputTitle, setInputTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const tree = useMemo(() => buildCategoryTree(categories), [categories])

  // -------------------- CRUD --------------------
  const handleCreate = async () => {
    if (!inputTitle.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/categories/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: inputTitle, parent: selectedId }),
      })
      if (!res.ok) throw new Error('Failed to create')
      const data = await res.json()
      setCategories(prev => [...prev, data])
      if (selectedId) setExpanded(prev => [...new Set([...prev, selectedId])])
      setInputTitle('')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedId || !inputTitle.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/categories/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedId, title: inputTitle }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setCategories(prev => prev.map(c => c._id === selectedId ? { ...c, title: inputTitle } : c))
      setInputTitle('')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTargetId) return
    setIsProcessing(true)
    try {
      const res = await fetch('/api/categories/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTargetId }),
      })
      if (!res.ok) throw new Error('Failed to delete')
      setCategories(prev => prev.filter(c => c._id !== deleteTargetId))
      if (selectedId === deleteTargetId) setSelectedId(null)
      setDeleteTargetId(null)
    } catch (err) {
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  // -------------------- Reorder --------------------
  const handleReorder = (nodes: CategoryNode[], oldIndex: number, newIndex: number, parentId: string | null) => {
    const newOrder = arrayMoveImmutable(nodes, oldIndex, newIndex)
    const updatedFlat = [...categories]

    newOrder.forEach((cat, i) => {
      const idx = updatedFlat.findIndex(c => c._id === cat._id)
      if (idx > -1) updatedFlat[idx].order = i
    })

    setCategories(updatedFlat)

    fetch('/api/categories/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parent: parentId,
        order: newOrder.map((c, i) => ({ id: c._id, order: i })),
      }),
    }).catch(console.error)
  }

  // -------------------- Tree Rendering --------------------
  const toggleExpand = (id: string) => {
    setExpanded(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id])
  }

  const renderTree = (nodes: CategoryNode[], level = 0) => {
    return nodes.map(node => {
      const isExpanded = expanded.includes(node._id)
      const hasChildren = node.children.length > 0
      return (
        <div key={node._id} style={{ marginLeft: level * 20 }} className={styles.categoryRow}>
          {hasChildren && (
            <button className={styles.toggleBtn} onClick={() => toggleExpand(node._id)}>
              {isExpanded ? '▾' : '▸'}
            </button>
          )}
          <span
            className={selectedId === node._id ? styles.nodeSelected : ''}
            onClick={() => setSelectedId(node._id)}
          >
            {node.title}
          </span>
          {hasChildren && isExpanded && renderTree(node.children, level + 1)}
        </div>
      )
    })
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Category Manager</h1>

      {/* Controls */}
      <div className={styles.controls}>
        <input
          className={styles.input}
          placeholder={selectedId ? 'Add subcategory or update selected' : 'Add new top-level category'}
          value={inputTitle}
          onChange={e => setInputTitle(e.target.value)}
        />
        <button onClick={handleCreate} disabled={!inputTitle.trim()}>Create</button>
        <button onClick={handleUpdate} disabled={!selectedId || !inputTitle.trim()}>Update</button>
        <button onClick={() => setDeleteTargetId(selectedId)} disabled={!selectedId}>Delete</button>
      </div>

      {/* Category Tree */}
      <div className={styles.checkboxGroup}>
        {renderTree(tree)}
      </div>

      {/* Delete Confirmation */}
      {deleteTargetId && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            {isProcessing ? (
              <p>Deleting...</p>
            ) : (
              <>
                <p>Are you sure you want to delete this category?</p>
                <button onClick={() => setDeleteTargetId(null)}>Cancel</button>
                <button onClick={handleDelete}>Delete</button>
              </>
            )}
          </div>
        </div>
      )}

      {loading && <p>Processing...</p>}
    </div>
  )
}

// -------------------- Static Props --------------------
import { client } from '../../lib/sanity' // your sanity client

export async function getStaticProps() {
  const categories: CategoryRaw[] = await client.fetch(`
    *[_type=="category"]{
      _id,
      title,
      parent->{_id, title},
      order
    } | order(order asc)
  `)

  return {
    props: { categories: categories || [] },
    revalidate: 60,
  }
}