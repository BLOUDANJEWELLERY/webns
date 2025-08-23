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
import React from 'react'

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

// -------------------- Build hierarchical tree --------------------
const buildTree = (categories: CategoryRaw[]): CategoryNode[] => {
  const map: Record<string, CategoryNode> = {}
  const roots: CategoryNode[] = []

  categories.forEach(cat => (map[cat._id] = { ...cat, children: [] }))
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

// -------------------- Sortable item --------------------
interface SortableItemProps {
  id: string
  title: string
  selected: boolean
  onSelect: () => void
  level: number
  hasChildren: boolean
  isExpanded: boolean
  toggleExpand: () => void
}

const SortableItem: React.FC<SortableItemProps> = ({
  id,
  title,
  selected,
  onSelect,
  level,
  hasChildren,
  isExpanded,
  toggleExpand,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        padding: '6px 12px',
        border: selected ? '2px solid #b88b4a' : '1px solid #ccc',
        marginBottom: 4,
        borderRadius: 4,
        cursor: 'grab',
        background: selected ? '#fff7e6' : '#fff',
        marginLeft: level * 20,
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {hasChildren && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              toggleExpand()
            }}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontWeight: 'bold',
              width: 20,
            }}
          >
            {isExpanded ? '-' : '+'}
          </button>
        )}
        <span
          onClick={onSelect}
          style={{ flex: 1, cursor: 'pointer', userSelect: 'none' }}
        >
          {title}
        </span>
      </div>
    </div>
  )
}

// -------------------- Recursive tree renderer --------------------
const renderTree = (
  nodes: CategoryNode[],
  selectedId: string | null,
  onSelect: (id: string) => void,
  expanded: Record<string, boolean>,
  toggleExpand: (id: string) => void,
  level = 0
): React.ReactNode[] => {
  return nodes.flatMap(node => {
    const isExpanded = !!expanded[node._id]
    const hasChildren = node.children.length > 0

    return [
      <SortableItem
        key={node._id}
        id={node._id}
        title={node.title}
        selected={selectedId === node._id}
        onSelect={() => onSelect(node._id)}
        level={level}
        hasChildren={hasChildren}
        isExpanded={isExpanded}
        toggleExpand={() => toggleExpand(node._id)}
      />,
      hasChildren && isExpanded
        ? renderTree(node.children, selectedId, onSelect, expanded, toggleExpand, level + 1)
        : [],
    ]
  })
}

// -------------------- Categories page --------------------
interface CategoriesPageProps {
  categories: CategoryRaw[]
}

export default function CategoriesPage({ categories: initialCategories }: CategoriesPageProps) {
  const [catList, setCatList] = useState<CategoryRaw[]>(initialCategories || [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [inputTitle, setInputTitle] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const tree = useMemo(() => buildTree(catList), [catList])
  const sensors = useSensors(useSensor(PointerSensor))

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
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
      if (!res.ok) throw new Error('Failed to create category')
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
      if (!res.ok) throw new Error('Failed to delete category')
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

    // Persist order update
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
          {renderTree(tree, selectedId, setSelectedId, expanded, toggleExpand)}
        </SortableContext>
      </DndContext>
    </div>
  )
}

// -------------------- Fetch categories --------------------
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