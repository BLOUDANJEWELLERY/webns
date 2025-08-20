import { useState, useEffect } from 'react'
import styles from '../../styles/admincat.module.css'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Category = {
  _id: string
  title: string
  parent?: { _id: string; title: string }
  children: Category[]
  order?: number
}

// ---------- Helpers ----------
function buildTree(categories: Category[], parentId: string | null = null): Category[] {
  return categories
    .filter(cat => (parentId ? cat.parent?._id === parentId : !cat.parent))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(cat => ({ ...cat, children: buildTree(categories, cat._id) }))
}

// ---------- Sortable Item ----------
function SortableItem({
  category,
  expanded,
  toggleExpand,
  selectedId,
  setSelectedId,
  onReorder,
}: {
  category: Category
  expanded: string[]
  toggleExpand: (id: string) => void
  selectedId: string | null
  setSelectedId: (id: string) => void
  onReorder: (nodes: Category[], oldIndex: number, newIndex: number, parentId: string | null) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category._id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const isExpanded = expanded.includes(category._id)
  const isSelected = selectedId === category._id

  return (
    <li ref={setNodeRef} style={style} {...attributes}>
      <div
        className={`${styles.node} ${isSelected ? styles.nodeSelected : ''}`}
        {...listeners}
        onClick={() => setSelectedId(category._id)}
      >
        {category.children.length > 0 && (
          <button
            className={styles.toggle}
            onClick={e => { e.stopPropagation(); toggleExpand(category._id) }}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}
        <span>{category.title}</span>
      </div>

      {category.children.length > 0 && isExpanded && (
        <SortableTree
          nodes={category.children}
          expanded={expanded}
          toggleExpand={toggleExpand}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          onReorder={(nodes, oldIndex, newIndex) =>
            onReorder(nodes, oldIndex, newIndex, category._id)
          }
        />
      )}
    </li>
  )
}

// ---------- Sortable Tree ----------
function SortableTree({
  nodes,
  expanded,
  toggleExpand,
  selectedId,
  setSelectedId,
  parentId = null,
  onReorder,
}: {
  nodes: Category[]
  expanded: string[]
  toggleExpand: (id: string) => void
  selectedId: string | null
  setSelectedId: (id: string) => void
  parentId?: string | null
  onReorder: (nodes: Category[], oldIndex: number, newIndex: number, parentId: string | null) => void
}) {
  const sensors = useSensors(useSensor(PointerSensor))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = nodes.findIndex(n => n._id === active.id)
    const newIndex = nodes.findIndex(n => n._id === over.id)
    onReorder(nodes, oldIndex, newIndex, parentId || null)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={nodes.map(n => n._id)} strategy={verticalListSortingStrategy}>
        <ul className={styles.tree}>
          {nodes.map(node => (
            <SortableItem
              key={node._id}
              category={node}
              expanded={expanded}
              toggleExpand={toggleExpand}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              onReorder={onReorder}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

// ---------- Main Component ----------
export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [inputTitle, setInputTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<string[]>([])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Failed to fetch categories')
      const data = await res.json()
      setCategories(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { fetchCategories() }, [])

  const tree = buildTree(categories)

  const toggleExpand = (id: string) => {
    setExpanded(prev => (prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]))
  }

  // ---------- CRUD ----------
  const handleCreate = async () => {
    if (!inputTitle.trim()) return
    setLoading(true)
    try {
      await fetch('/api/categories/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: inputTitle, parent: selectedId }),
      })
      await fetchCategories()
      if (selectedId) setExpanded(prev => [...new Set([...prev, selectedId])])
    } finally {
      setLoading(false)
      setInputTitle('')
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
      await fetchCategories()
    } finally {
      setLoading(false)
      setInputTitle('')
    }
  }

  const handleDelete = async () => {
    if (!selectedId) return
    if (!confirm('Delete this category and all its subcategories?')) return
    setLoading(true)
    try {
      await fetch('/api/categories/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedId }),
      })
      await fetchCategories()
      setSelectedId(null)
    } finally {
      setLoading(false)
    }
  }

  // ---------- Reorder ----------
  const handleReorder = async (nodes: Category[], oldIndex: number, newIndex: number, parentId: string | null) => {
    const newOrder = arrayMove(nodes, oldIndex, newIndex)

    setCategories(prev => {
      const updated = [...prev]
      newOrder.forEach((cat, i) => {
        const idx = updated.findIndex(c => c._id === cat._id)
        if (idx > -1) updated[idx].order = i
      })
      return updated
    })

    await fetch('/api/categories/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parent: parentId,
        order: newOrder.map((c, i) => ({ id: c._id, order: i })),
      }),
    })
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Category Manager</h1>

      <div className={styles.controls}>
        <input
          className={styles.input}
          placeholder={selectedId ? 'Edit or add subcategory' : 'Add new top-level category'}
          value={inputTitle}
          onChange={e => setInputTitle(e.target.value)}
        />
        <button onClick={handleCreate} disabled={!inputTitle.trim()}>Add</button>
        <button onClick={handleUpdate} disabled={!selectedId || !inputTitle.trim()}>Update</button>
        <button onClick={handleDelete} disabled={!selectedId}>Delete</button>
      </div>

      <SortableTree
        nodes={tree}
        expanded={expanded}
        toggleExpand={toggleExpand}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        onReorder={handleReorder}
      />

      {loading && <p className={styles.loading}>Working...</p>}
    </div>
  )
}