import { useState, useMemo } from 'react'
import styles from '../../styles/admincat.module.css'
import { arrayMove } from '@dnd-kit/sortable'

interface CategoryRaw {
  _id: string
  title: string
  parent?: { _id: string; title }
  order?: number
}

interface CategoryNode {
  _id: string
  title: string
  parent?: { _id: string; title }
  order?: number
  children: CategoryNode[]
}

export default function CategoryManager({ categories }: { categories: CategoryRaw[] }) {
  const [catList, setCatList] = useState<CategoryRaw[]>(categories)
  const [expanded, setExpanded] = useState<string[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [inputTitle, setInputTitle] = useState('')
  const [loading, setLoading] = useState(false)

  // Build tree
  const buildTree = (cats: CategoryRaw[], parentId: string | null = null): CategoryNode[] => {
    const map: Record<string, CategoryNode> = {}
    const roots: CategoryNode[] = []

    cats.forEach(c => (map[c._id] = { ...c, children: [] }))

    cats.forEach(c => {
      if (c.parent?._id) map[c.parent._id].children.push(map[c._id])
      else roots.push(map[c._id])
    })

    const sortTree = (nodes: CategoryNode[]) => {
      nodes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      nodes.forEach(n => sortTree(n.children))
    }

    sortTree(roots)
    return roots
  }

  const tree = useMemo(() => buildTree(catList), [catList])

  const toggleExpand = (id: string) =>
    setExpanded(prev => (prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]))

  // ---------- CRUD ----------
  const handleCreate = async () => {
    if (!inputTitle.trim()) return
    setLoading(true)
    try {
      const parentId = selectedId
      await fetch('/api/categories/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: inputTitle, parent: parentId }),
      })
      setInputTitle('')
      // Re-fetch static props or use incremental update
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedId || !inputTitle.trim()) return
    setLoading(true)
    try {
      await fetch('/api/categories/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedId, title: inputTitle }),
      })
      setInputTitle('')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedId) return
    setLoading(true)
    try {
      await fetch('/api/categories/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedId }),
      })
      setSelectedId(null)
    } finally {
      setLoading(false)
    }
  }

  const handleReorder = async (nodes: CategoryNode[], oldIndex: number, newIndex: number, parentId: string | null) => {
    const newOrder = arrayMove(nodes, oldIndex, newIndex)
    // Update state locally
    // Then call API
  }

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <input
          value={inputTitle}
          onChange={e => setInputTitle(e.target.value)}
          placeholder={selectedId ? 'Edit or add subcategory' : 'Add new top-level category'}
        />
        <button onClick={handleCreate}>Add</button>
        <button onClick={handleUpdate} disabled={!selectedId}>Update</button>
        <button onClick={handleDelete} disabled={!selectedId}>Delete</button>
      </div>

      <CategoryTree
        nodes={tree}
        expanded={expanded}
        toggleExpand={toggleExpand}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
      />
    </div>
  )
}

type TreeProps = {
  nodes: CategoryNode[]
  expanded: string[]
  toggleExpand: (id: string) => void
  selectedId: string | null
  setSelectedId: (id: string) => void
}

const CategoryTree: React.FC<TreeProps> = ({ nodes, expanded, toggleExpand, selectedId, setSelectedId }) => {
  return (
    <ul className={styles.tree}>
      {nodes.map(n => (
        <CategoryNodeItem
          key={n._id}
          node={n}
          expanded={expanded}
          toggleExpand={toggleExpand}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
        />
      ))}
    </ul>
  )
}

type NodeProps = {
  node: CategoryNode
  expanded: string[]
  toggleExpand: (id: string) => void
  selectedId: string | null
  setSelectedId: (id: string) => void
}

const CategoryNodeItem: React.FC<NodeProps> = ({ node, expanded, toggleExpand, selectedId, setSelectedId }) => {
  const isExpanded = expanded.includes(node._id)
  const isSelected = selectedId === node._id
  return (
    <li>
      <div className={`${styles.node} ${isSelected ? styles.selected : ''}`} onClick={() => setSelectedId(node._id)}>
        {node.children.length > 0 && (
          <button className={styles.toggleBtn} onClick={e => { e.stopPropagation(); toggleExpand(node._id) }}>
            {isExpanded ? '▾' : '▸'}
          </button>
        )}
        <span>{node.title}</span>
      </div>
      {isExpanded && node.children.length > 0 && (
        <CategoryTree nodes={node.children} expanded={expanded} toggleExpand={toggleExpand} selectedId={selectedId} setSelectedId={setSelectedId} />
      )}
    </li>
  )
}