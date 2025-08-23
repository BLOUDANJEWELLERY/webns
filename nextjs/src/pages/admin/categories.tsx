// src/pages/admin/categories.tsx
import { useState, useMemo } from 'react'
import styles from '../../styles/admincat.module.css'
import { client } from '../../lib/sanity' // adjust to your sanity client import

interface CategoryRaw {
  _id: string
  title: string
  parent?: { _id: string; title: string }
  order?: number
}

interface CategoryNode {
  _id: string
  title: string
  parent?: { _id: string; title: string }
  order?: number
  children: CategoryNode[]
}

// ---------- Array move ----------
function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const newArr = [...arr]
  const item = newArr.splice(from, 1)[0]
  newArr.splice(to, 0, item)
  return newArr
}

// ---------- Build tree ----------
const buildTree = (cats: CategoryRaw[] = []): CategoryNode[] => {
  const map: Record<string, CategoryNode> = {}
  const roots: CategoryNode[] = []

  cats.forEach(cat => {
    map[cat._id] = { ...cat, children: [] }
  })

  cats.forEach(cat => {
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

// ---------- Recursive Tree Node ----------
type CategoryNodeItemProps = {
  node: CategoryNode
  expanded: string[]
  toggleExpand: (id: string) => void
  selectedId: string | null
  setSelectedId: (id: string) => void
}

const CategoryNodeItem: React.FC<CategoryNodeItemProps> = ({
  node,
  expanded,
  toggleExpand,
  selectedId,
  setSelectedId,
}) => {
  const isExpanded = expanded.includes(node._id)
  const isSelected = selectedId === node._id

  return (
    <div className={styles.nodeWrapper}>
      <div
        className={`${styles.node} ${isSelected ? styles.nodeSelected : ''}`}
        onClick={() => setSelectedId(node._id)}
      >
        {node.children.length > 0 && (
          <button
            className={styles.toggleBtn}
            onClick={e => {
              e.stopPropagation()
              toggleExpand(node._id)
            }}
          >
            {isExpanded ? '▾' : '▸'}
          </button>
        )}
        <span>{node.title}</span>
      </div>

      {isExpanded && node.children.length > 0 && (
        <div className={styles.nested}>
          {node.children.map(child => (
            <CategoryNodeItem
              key={child._id}
              node={child}
              expanded={expanded}
              toggleExpand={toggleExpand}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------- Main Component ----------
export default function CategoriesPage({ categories }: { categories: CategoryRaw[] }) {
  const [catList, setCatList] = useState<CategoryRaw[]>(categories || [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string[]>([])
  const [inputTitle, setInputTitle] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const tree = useMemo(() => buildTree(catList), [catList])

  const toggleExpand = (id: string) => {
    setExpanded(prev =>
      prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]
    )
  }

  // ---------- CRUD ----------
  const handleCreate = async () => {
    if (!inputTitle.trim()) return
    setIsProcessing(true)
    try {
      const res = await fetch('/api/categories/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: inputTitle, parent: selectedId }),
      })
      if (!res.ok) throw new Error('Failed to create')
      const newCat = await res.json()
      setCatList(prev => [...prev, newCat])
      if (selectedId) setExpanded(prev => [...new Set([...prev, selectedId])])
    } catch (err) {
      console.error(err)
      alert('Failed to create category')
    } finally {
      setIsProcessing(false)
      setInputTitle('')
    }
  }

  const handleUpdate = async () => {
    if (!selectedId || !inputTitle.trim()) return
    setIsProcessing(true)
    try {
      const res = await fetch('/api/categories/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedId, title: inputTitle }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setCatList(prev =>
        prev.map(c => (c._id === selectedId ? { ...c, title: inputTitle } : c))
      )
    } catch (err) {
      console.error(err)
      alert('Failed to update category')
    } finally {
      setIsProcessing(false)
      setInputTitle('')
    }
  }

  const handleDelete = async () => {
    if (!selectedId) return
    setIsProcessing(true)
    try {
      const res = await fetch('/api/categories/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedId }),
      })
      if (!res.ok) throw new Error('Failed to delete')
      setCatList(prev => prev.filter(c => c._id !== selectedId))
      setSelectedId(null)
    } catch (err) {
      console.error(err)
      alert('Failed to delete category')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className={styles.container}>
      <h1>Category Manager</h1>

      <div className={styles.controls}>
        <input
          placeholder={selectedId ? 'Edit or add subcategory' : 'Add new top-level category'}
          value={inputTitle}
          onChange={e => setInputTitle(e.target.value)}
        />
        <button onClick={handleCreate} disabled={isProcessing || !inputTitle.trim()}>Add</button>
        <button onClick={handleUpdate} disabled={isProcessing || !selectedId || !inputTitle.trim()}>Update</button>
        <button onClick={handleDelete} disabled={isProcessing || !selectedId}>Delete</button>
      </div>

      <div>
        {tree.map(node => (
          <CategoryNodeItem
            key={node._id}
            node={node}
            expanded={expanded}
            toggleExpand={toggleExpand}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
          />
        ))}
      </div>
    </div>
  )
}

// ---------- getStaticProps ----------
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
    props: {
      categories: categories || [],
    },
    revalidate: 60,
  }
}