import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import styles from '../../styles/admincat.module.css'

type Category = {
  _id: string
  title: string
  parent?: { _id: string; title: string }
  children: Category[]
  order?: number
}

// ---------- Build Tree ----------
function buildTree(categories: Category[], parentId: string | null = null): Category[] {
  return categories
    .filter(c => (parentId ? c.parent?._id === parentId : !c.parent))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(c => ({ ...c, children: buildTree(categories, c._id) }))
}

// ---------- Sortable Item ----------
function SortableItem({
  category,
  expanded,
  toggleExpand,
  selectedId,
  setSelectedId,
}: {
  category: Category
  expanded: string[]
  toggleExpand: (id: string) => void
  selectedId: string | null
  setSelectedId: (id: string) => void
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
            {isExpanded ? '▾' : '▸'}
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
}: {
  nodes: Category[]
  expanded: string[]
  toggleExpand: (id: string) => void
  selectedId: string | null
  setSelectedId: (id: string) => void
}) {
  const sensors = useSensors(useSensor(PointerSensor))

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = nodes.findIndex(n => n._id === active.id)
    const newIndex = nodes.findIndex(n => n._id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const newOrder = arrayMove(nodes, oldIndex, newIndex)
    
    // Save new order to backend
    await fetch('/api/categories/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parent: nodes[0]?.parent?._id || null,
        order: newOrder.map((c, i) => ({ id: c._id, order: i })),
      }),
    })
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
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

// ---------- Main Page ----------
export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [expanded, setExpanded] = useState<string[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [inputTitle, setInputTitle] = useState('')
  const [loading, setLoading] = useState(false)

  // Fetch categories
  const fetchCategories = async () => {
    const res = await fetch('/api/categories')
    const data = await res.json()
    setCategories(data)
  }

  useEffect(() => { fetchCategories() }, [])

  const toggleExpand = (id: string) => {
    setExpanded(prev => (prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]))
  }

  // ---------- CRUD ----------
  const handleCreate = async () => {
    if (!inputTitle.trim()) return
    setLoading(true)
    await fetch('/api/categories/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: inputTitle, parent: selectedId }),
    })
    setInputTitle('')
    setLoading(false)
    await fetchCategories()
  }

  const handleUpdate = async () => {
    if (!selectedId || !inputTitle.trim()) return
    setLoading(true)
    await fetch('/api/categories/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedId, title: inputTitle }),
    })
    setInputTitle('')
    setLoading(false)
    await fetchCategories()
  }

  const handleDelete = async () => {
    if (!selectedId) return
    setLoading(true)
    await fetch('/api/categories/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedId }),
    })
    setSelectedId(null)
    setLoading(false)
    await fetchCategories()
  }

  const tree = buildTree(categories)

  return (
    <div className={styles.container}>
      <h1>Category Manager</h1>

      <div className={styles.controls}>
        <input
          placeholder="Category name"
          value={inputTitle}
          onChange={e => setInputTitle(e.target.value)}
        />
        <button onClick={handleCreate}>Create</button>
        <button onClick={handleUpdate} disabled={!selectedId}>Update</button>
        <button onClick={handleDelete} disabled={!selectedId}>Delete</button>
      </div>

      <SortableTree
        nodes={tree}
        expanded={expanded}
        toggleExpand={toggleExpand}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
      />

      {loading && <p>Processing...</p>}
    </div>
  )
}