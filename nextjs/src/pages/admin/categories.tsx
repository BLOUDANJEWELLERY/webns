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
  editing,
  setEditing,
  newCategory,
  setNewCategory,
  handleCreate,
  handleUpdate,
  handleDelete,
  onReorder,
}: {
  category: Category
  expanded: string[]
  toggleExpand: (id: string) => void
  editing: { id: string; title: string } | null
  setEditing: (edit: { id: string; title: string } | null) => void
  newCategory: { parent: string | null; title: string }
  setNewCategory: (cat: { parent: string | null; title: string }) => void
  handleCreate: (parent: string | null) => void
  handleUpdate: (id: string, title: string) => void
  handleDelete: (id: string) => void
  onReorder: (nodes: Category[], oldIndex: number, newIndex: number, parentId: string | null) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category._id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const isExpanded = expanded.includes(category._id)

  return (
    <li ref={setNodeRef} style={style} {...attributes}>
      {editing?.id === category._id ? (
        <div className={styles.inlineForm}>
          <input
            className={styles.input}
            value={editing.title}
            onChange={e => setEditing({ ...editing, title: e.target.value })}
          />
          <button onClick={() => handleUpdate(category._id, editing.title)}>Save</button>
          <button onClick={() => setEditing(null)}>Cancel</button>
        </div>
      ) : (
        <div className={styles.node}>
          {category.children.length > 0 && (
            <button className={styles.toggle} onClick={() => toggleExpand(category._id)}>
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          <span {...listeners}>{category.title}</span>
          <div className={styles.actions}>
            <button onClick={() => setEditing({ id: category._id, title: category.title })}>✏️</button>
            <button onClick={() => handleDelete(category._id)}>🗑</button>
            <button onClick={() => setNewCategory({ parent: category._id, title: '' })}>➕</button>
          </div>
        </div>
      )}

      {newCategory.parent === category._id && (
        <div className={styles.inlineForm}>
          <input
            className={styles.input}
            placeholder="New subcategory"
            value={newCategory.title}
            onChange={e => setNewCategory({ ...newCategory, title: e.target.value })}
          />
          <button onClick={() => handleCreate(category._id)}>Add</button>
          <button onClick={() => setNewCategory({ parent: null, title: '' })}>Cancel</button>
        </div>
      )}

      {category.children.length > 0 && isExpanded && (
        <SortableTree
          nodes={category.children}
          expanded={expanded}
          toggleExpand={toggleExpand}
          editing={editing}
          setEditing={setEditing}
          newCategory={newCategory}
          setNewCategory={setNewCategory}
          handleCreate={handleCreate}
          handleUpdate={handleUpdate}
          handleDelete={handleDelete}
          parentId={category._id}
          onReorder={onReorder}
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
  editing,
  setEditing,
  newCategory,
  setNewCategory,
  handleCreate,
  handleUpdate,
  handleDelete,
  parentId = null,
  onReorder,
}: {
  nodes: Category[]
  expanded: string[]
  toggleExpand: (id: string) => void
  editing: { id: string; title: string } | null
  setEditing: (edit: { id: string; title: string } | null) => void
  newCategory: { parent: string | null; title: string }
  setNewCategory: (cat: { parent: string | null; title: string }) => void
  handleCreate: (parent: string | null) => void
  handleUpdate: (id: string, title: string) => void
  handleDelete: (id: string) => void
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
              editing={editing}
              setEditing={setEditing}
              newCategory={newCategory}
              setNewCategory={setNewCategory}
              handleCreate={handleCreate}
              handleUpdate={handleUpdate}
              handleDelete={handleDelete}
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
  const [newCategory, setNewCategory] = useState<{ parent: string | null; title: string }>({ parent: null, title: '' })
  const [editing, setEditing] = useState<{ id: string; title: string } | null>(null)
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

  // ---------- CRUD ----------
  const handleCreate = async (parent: string | null) => {
    if (!newCategory.title.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/categories/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newCategory.title, parent }),
      })
      const created = await res.json()
      await fetchCategories()
      if (parent) setExpanded(prev => [...new Set([...prev, parent])])
      setExpanded(prev => [...new Set([...prev, created._id])])
    } finally {
      setLoading(false)
      setNewCategory({ parent: null, title: '' })
    }
  }

  const handleUpdate = async (id: string, title: string) => {
    if (!title.trim()) return
    setLoading(true)
    try {
      await fetch('/api/categories/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title }),
      })
      await fetchCategories()
    } finally {
      setLoading(false)
      setEditing(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category and all its subcategories?')) return
    setLoading(true)
    try {
      await fetch('/api/categories/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      await fetchCategories()
      setExpanded(prev => prev.filter(eid => eid !== id))
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (id: string) => {
    setExpanded(prev => (prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]))
  }

  // ---------- Reorder ----------
  const handleReorder = async (nodes: Category[], oldIndex: number, newIndex: number, parentId: string | null) => {
    const newOrder = arrayMove(nodes, oldIndex, newIndex)

    // Update local state
    setCategories(prev => {
      const updated = [...prev]
      newOrder.forEach((cat, i) => {
        const idx = updated.findIndex(c => c._id === cat._id)
        if (idx > -1) updated[idx].order = i
      })
      return updated
    })

    // Send only sibling items to backend
    await fetch('/api/categories/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order: newOrder.map((c, i) => ({ id: c._id, order: i })),
      }),
    })
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Category Manager</h1>

      <SortableTree
        nodes={tree}
        expanded={expanded}
        toggleExpand={toggleExpand}
        editing={editing}
        setEditing={setEditing}
        newCategory={newCategory}
        setNewCategory={setNewCategory}
        handleCreate={handleCreate}
        handleUpdate={handleUpdate}
        handleDelete={handleDelete}
        onReorder={handleReorder}
      />

      {loading && <p className={styles.loading}>Working...</p>}

      {newCategory.parent === null && (
        <div className={styles.inlineForm}>
          <input
            className={styles.input}
            placeholder="New top-level category"
            value={newCategory.title}
            onChange={e => setNewCategory({ parent: null, title: e.target.value })}
          />
          <button onClick={() => handleCreate(null)}>Add</button>
        </div>
      )}
    </div>
  )
}