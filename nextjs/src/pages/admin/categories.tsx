import { useState, useMemo, useEffect, useRef } from 'react'
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
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import React from 'react'
import { client } from '../../lib/sanityClient'

// ---------------- Types ----------------
export interface CategoryRaw {
  _id: string
  title: string
  parent?: { _id: string; title: string }
  order?: number
}

interface CategoryNode extends CategoryRaw {
  children: CategoryNode[]
}

// ---------------- Build hierarchical tree ----------------
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

// ---------------- Sortable Item ----------------
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
  id, title, selected, onSelect, level, hasChildren, isExpanded, toggleExpand,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`${styles.item} ${selected ? styles.selected : ''}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition || 'transform 150ms ease', // smoother feel
        userSelect: 'none',
      }}
    >
      <div className={styles.itemContent} style={{ marginLeft: level * 20 }}>
        {hasChildren && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); toggleExpand() }}
            className={styles.toggleBtn}
          >
            {isExpanded ? '▼' : '►'}
          </button>
        )}
        <span onClick={onSelect} className={styles.title}>{title}</span>
      </div>

      {/* Drag handle - responsive & selectable */}
      <div
        {...attributes}
        {...listeners}
        className={styles.dragHandle}
        style={{
          touchAction: 'none', // ensures immediate drag on touch devices
          cursor: 'grab',
        }}
      >
        ⋮⋮
      </div>
    </div>
  )
}

// ---------------- Recursive Tree Renderer ----------------
const renderTree = (
  nodes: CategoryNode[],
  selectedId: string | null,
  onSelect: (id: string) => void,
  expanded: Record<string, boolean>,
  toggleExpand: (id: string) => void,
  level = 0
): React.ReactNode => {
  if (!nodes.length) return null

  return (
    <SortableContext items={nodes.map(n => n._id)} strategy={verticalListSortingStrategy}>
      {nodes.map(node => {
        const isExpanded = !!expanded[node._id]
        const hasChildren = node.children.length > 0

        return (
          <React.Fragment key={node._id}>
            <div className={styles.treeLineWrapper}>
              <SortableItem
                id={node._id}
                title={node.title}
                selected={selectedId === node._id}
                onSelect={() => onSelect(node._id)}
                level={level}
                hasChildren={hasChildren}
                isExpanded={isExpanded}
                toggleExpand={() => toggleExpand(node._id)}
              />
              {hasChildren && isExpanded && (
                <div className={styles.childBranch}>
                  {renderTree(node.children, selectedId, onSelect, expanded, toggleExpand, level + 1)}
                </div>
              )}
            </div>
          </React.Fragment>
        )
      })}
    </SortableContext>
  )
}

// ---------------- Main Component ----------------
interface Props {
  categories: CategoryRaw[]
}

export default function CategoriesPage({ categories }: Props) {
  const [catList, setCatList] = useState<CategoryRaw[]>(categories)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [inputTitle, setInputTitle] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  // Smoother drag handling
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 2, // drag starts almost immediately
      },
    })
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<HTMLDivElement>(null)
  const treeRef = useRef<HTMLDivElement>(null)

  const toggleExpand = (id: string) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  // Deselect when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !controlsRef.current?.contains(e.target as Node) &&
        !treeRef.current?.contains(e.target as Node)
      ) {
        setSelectedId(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // ---------------- Data Refresh ----------------
  const fetchLatest = async () => {
    setIsProcessing(true)
    const data = await fetch('/api/categories').then(r => r.json())
    setCatList(data)
    setIsProcessing(false)
  }

  // ---------------- CRUD ----------------
  const handleCreate = async () => {
    if (!inputTitle.trim()) return
    setIsProcessing(true)
    const parentId = selectedId || null
    await fetch('/api/categories/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: inputTitle, parent: parentId }),
    })
    setInputTitle('')
    await fetchLatest()
  }

  const handleUpdate = async () => {
    if (!selectedId || !inputTitle.trim()) return
    setCatList(prev => prev.map(c => c._id === selectedId ? { ...c, title: inputTitle } : c))
    setInputTitle('')
    await fetch('/api/categories/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedId, title: inputTitle }),
    })
    await fetchLatest()
  }

  const handleDelete = async () => {
    if (!selectedId) return
    setCatList(prev => prev.filter(c => c._id !== selectedId))
    setSelectedId(null)
    await fetch('/api/categories/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedId }),
    })
    await fetchLatest()
  }

  // ---------------- Drag & Drop ----------------
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const parentId = catList.find(c => c._id === active.id)?.parent?._id || null
    const siblings = catList.filter(c => (c.parent?._id || null) === parentId)
    const oldIndex = siblings.findIndex(c => c._id === active.id)
    const newIndex = siblings.findIndex(c => c._id === over.id)

    const reordered = arrayMove(siblings, oldIndex, newIndex)

    const newList = catList.map(c => {
      if ((c.parent?._id || null) === parentId) {
        return { ...c, order: reordered.findIndex(s => s._id === c._id) }
      }
      return c
    })

    setCatList(newList)

    try {
      await fetch('/api/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent: parentId,
          order: reordered.map((c, i) => ({ id: c._id, order: i })),
        }),
      })
      fetchLatest()
    } catch (err) {
      console.error('Reorder failed:', err)
      fetchLatest()
    }
  }

  const tree = useMemo(() => buildTree(catList), [catList])

  return (
<>
<AdminHeader title="Admin Panel" titleHref="../" />
    <div className={styles.container} ref={containerRef}>
      <h1 className={styles.pageTitle}>Categories</h1>
      {isProcessing && <div>Processing...</div>}
      <div className={styles.controls} ref={controlsRef}>
        <input
          placeholder={selectedId ? 'Edit or add subcategory' : 'Add new top-level category'}
          value={inputTitle}
          onChange={e => setInputTitle(e.target.value)}
        />
        <button onClick={handleCreate} disabled={isProcessing || !inputTitle.trim()}>Add</button>
        <button onClick={handleUpdate} disabled={isProcessing || !selectedId || !inputTitle.trim()}>Update</button>
        <button onClick={handleDelete} disabled={isProcessing || !selectedId}>Delete</button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]} // only vertical movement
      >
        <div className={styles.treeWrapper} ref={treeRef}>
          {renderTree(tree, selectedId, setSelectedId, expanded, toggleExpand)}
        </div>
      </DndContext>
    </div>
  )
}

// ---------------- getStaticProps ----------------
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