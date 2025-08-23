import { useState, useMemo } from 'react'
import useSWR from 'swr'
import styles from '../../styles/admincat.module.css'
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
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import React from 'react'

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

// -------------------- Sortable Item --------------------
interface SortableItemProps {
  node: CategoryNode
  selectedId: string | null
  onSelect: (id: string) => void
  level: number
  expanded: Record<string, boolean>
  toggleExpand: (id: string) => void
}

const SortableItem: React.FC<SortableItemProps> = ({
  node,
  selectedId,
  onSelect,
  level,
  expanded,
  toggleExpand,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: node._id })
  const isExpanded = !!expanded[node._id]
  const hasChildren = node.children.length > 0

  return (
    <>
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          padding: '6px 12px',
          border: selectedId === node._id ? '2px solid #b88b4a' : '1px solid #ccc',
          marginBottom: 4,
          borderRadius: 4,
          background: selectedId === node._id ? '#fff7e6' : '#fff',
          display: 'flex',
          alignItems: 'center',
          userSelect: 'none',
          marginLeft: level * 20,
        }}
      >
        <div
          {...attributes}
          {...listeners}
          style={{
            cursor: 'grab',
            padding: '0 6px',
            fontWeight: 'bold',
            userSelect: 'none',
          }}
        >
          ::
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 6 }}>
          {hasChildren && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); toggleExpand(node._id) }}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', width: 20, fontWeight: 'bold' }}
            >
              {isExpanded ? '-' : '+'}
            </button>
          )}
          <span onClick={() => onSelect(node._id)} style={{ cursor: 'pointer', flex: 1 }}>
            {node.title}
          </span>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <SortableContext items={node.children.map(c => c._id)} strategy={verticalListSortingStrategy}>
          {node.children.map(child => (
            <SortableItem
              key={child._id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              level={level + 1}
              expanded={expanded}
              toggleExpand={toggleExpand}
            />
          ))}
        </SortableContext>
      )}
    </>
  )
}

// -------------------- SWR fetcher --------------------
const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function CategoriesPage() {
  const { data, mutate } = useSWR<CategoryRaw[]>('/api/categories', fetcher)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [inputTitle, setInputTitle] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const catList = data || []
  const tree = useMemo(() => buildTree(catList), [catList])
  const sensors = useSensors(useSensor(PointerSensor))

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // ------------------ CRUD ------------------
  const handleCreate = async () => {
    if (!inputTitle.trim()) return
    setIsProcessing(true)

    try {
      const res = await fetch('/api/categories/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: inputTitle, parent: selectedId }),
      })
      const savedCat = await res.json()
      mutate([...catList, savedCat], false)
      setInputTitle('')
    } finally { setIsProcessing(false) }
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
      mutate()
      setInputTitle('')
    } finally { setIsProcessing(false) }
  }

  const handleDelete = async () => {
    if (!selectedId) return
    setIsProcessing(true)
    try {
      await fetch('/api/categories/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedId }),
      })
      mutate()
      setSelectedId(null)
    } finally { setIsProcessing(false) }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const flattenList = (nodes: CategoryNode[]): CategoryRaw[] => {
      let result: CategoryRaw[] = []
      nodes.forEach(n => {
        result.push({ _id: n._id, title: n.title, parent: n.parent?._id ? { _id: n.parent._id, title: '' } : undefined, order: n.order })
        if (n.children.length > 0) result = result.concat(flattenList(n.children))
      })
      return result
    }

    const newTree = [...tree] // You may implement actual reorder logic here
    const newList = flattenList(newTree)
    mutate(newList, false)

    try {
      await fetch('/api/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent: null,
          order: newList.map((c, i) => ({ id: c._id, order: i })),
        }),
      })
      mutate()
    } catch (err) { console.error('Failed to persist order:', err) }
  }

  return (
    <div className={styles.container}>
      <h1>Category Manager</h1>
      {isProcessing && <div className={styles.processing}>Processing...</div>}

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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={catList.map(c => c._id)} strategy={verticalListSortingStrategy}>
          {tree.map(node => (
            <SortableItem
              key={node._id}
              node={node}
              selectedId={selectedId}
              onSelect={setSelectedId}
              level={0}
              expanded={expanded}
              toggleExpand={toggleExpand}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}