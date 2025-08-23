import { useState, useMemo } from 'react'
import styles from '../../styles/admincat.module.css'
import { client } from '../../lib/sanityClient'
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// -------------------- Types --------------------
interface CategoryRaw {
  _id: string
  title: string
  parent?: { _id: string; title }
  order?: number
}

interface CategoryNode extends CategoryRaw {
  children: CategoryNode[]
}

// -------------------- Build tree --------------------
const buildTree = (cats: CategoryRaw[]): CategoryNode[] => {
  const map: Record<string, CategoryNode> = {}
  const roots: CategoryNode[] = []

  cats.forEach(cat => (map[cat._id] = { ...cat, children: [] }))
  cats.forEach(cat => {
    if (cat.parent?._id && map[cat.parent._id]) map[cat.parent._id].children.push(map[cat._id])
    else roots.push(map[cat._id])
  })

  const sortTree = (nodes: CategoryNode[]) => {
    nodes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    nodes.forEach(n => sortTree(n.children))
  }
  sortTree(roots)
  return roots
}

// -------------------- Sortable item inline --------------------
const SortableItem: React.FC<{
  id: string
  title: string
  selected: boolean
  onClick: () => void
}> = ({ id, title, selected, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: '8px 12px',
    border: selected ? '2px solid #b88b4a' : '1px solid #ccc',
    marginBottom: 4,
    borderRadius: 4,
    cursor: 'grab',
    background: selected ? '#fff7e6' : '#fff',
    userSelect: 'none',
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={onClick}>
      {title}
    </div>
  )
}

// -------------------- Page --------------------
export default function CategoriesPage({ categories: initialCategories }: { categories: CategoryRaw[] }) {
  const [catList, setCatList] = useState<CategoryRaw[]>(initialCategories || [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [inputTitle, setInputTitle] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const tree = useMemo(() => buildTree(catList), [catList])
  const sensors = useSensors(useSensor(PointerSensor))

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
      setInputTitle('')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedId || !inputTitle.trim()) return
    setIsProcessing(true)
    try {
      await fetch('/api/categories/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedId, title: inputTitle }),
      })
      setCatList(prev => prev.map(c => (c._id === selectedId ? { ...c, title: inputTitle } : c)))
      setInputTitle('')
    } finally {
      setIsProcessing(false)
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
    } finally {
      setIsProcessing(false)
    }
  }

  // ---------- Drag & Drop ----------
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = catList.findIndex(c => c._id === active.id)
    const newIndex = catList.findIndex(c => c._id === over.id)
    const newList = arrayMove(catList, oldIndex, newIndex)
    setCatList(newList)

    // Persist reorder
    await fetch('/api/categories/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parent: null,
        order: newList.map((c, i) => ({ id: c._id, order: i })),
      }),
    })
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
        <button onClick={handleCreate} disabled={isProcessing || !inputTitle.trim()}>
          Add
        </button>
        <button onClick={handleUpdate} disabled={isProcessing || !selectedId || !inputTitle.trim()}>
          Update
        </button>
        <button onClick={handleDelete} disabled={isProcessing || !selectedId}>
          Delete
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={catList.map(c => c._id)} strategy={verticalListSortingStrategy}>
          {catList.map(cat => (
            <SortableItem
              key={cat._id}
              id={cat._id}
              title={cat.title}
              selected={selectedId === cat._id}
              onClick={() => setSelectedId(cat._id)}
            />
          ))}
        </SortableContext>
      </DndContext>
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
  return { props: { categories: categories || [] } }
}