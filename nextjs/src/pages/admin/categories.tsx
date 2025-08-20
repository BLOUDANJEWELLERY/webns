// src/pages/admin/categories.tsx
import { useState, useEffect, useRef, useMemo } from 'react'
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
import { createClient } from 'next-sanity'

// ---------------- Sanity Client ----------------
const client = createClient({
  projectId: '3jc8hsku',
  dataset: 'production',
  apiVersion: '2023-07-30',
  useCdn: false,
})

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
function SortableItem({ category, expanded, toggleExpand, selectedId, setSelectedId, onReorder }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category._id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const isExpanded = expanded.includes(category._id)
  const isSelected = selectedId === category._id

  return (
    <li ref={setNodeRef} style={style} {...attributes}>
      <div className={`${styles.node} ${isSelected ? styles.nodeSelected : ''}`} {...listeners} onClick={() => setSelectedId(category._id)}>
        {category.children.length > 0 && (
          <button className={styles.toggle} onClick={e => { e.stopPropagation(); toggleExpand(category._id) }}>
            {isExpanded ? '▼' : '▶'}
          </button>
        )}
        <span>{category.title}</span>
      </div>

      {category.children.length > 0 && isExpanded && (
        <SortableTree nodes={category.children} expanded={expanded} toggleExpand={toggleExpand} selectedId={selectedId} setSelectedId={setSelectedId} onReorder={(nodes: Category[], oldIndex: number, newIndex: number) => onReorder(nodes, oldIndex, newIndex, category._id)} />
      )}
    </li>
  )
}

// ---------- Sortable Tree ----------
function SortableTree({ nodes, expanded, toggleExpand, selectedId, setSelectedId, parentId = null, onReorder }: any) {
  const sensors = useSensors(useSensor(PointerSensor))
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = nodes.findIndex((n: Category) => n._id === active.id)
    const newIndex = nodes.findIndex((n: Category) => n._id === over.id)
    onReorder(nodes, oldIndex, newIndex, parentId || null)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={nodes.map((n: Category) => n._id)} strategy={verticalListSortingStrategy}>
        <ul className={styles.tree}>
          {nodes.map((node: Category) => (
            <SortableItem key={node._id} category={node} expanded={expanded} toggleExpand={toggleExpand} selectedId={selectedId} setSelectedId={setSelectedId} onReorder={onReorder} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

// ---------- Main Component ----------
export default function Categories({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [inputTitle, setInputTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<string[]>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const treeRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<HTMLDivElement>(null)

  // ---------- Click outside & Escape ----------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
      const target = event.target as Node
      if ((treeRef.current && treeRef.current.contains(target)) || (controlsRef.current && controlsRef.current.contains(target))) return
      setSelectedId(null)
    }
    const handleEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelectedId(null) }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const tree = useMemo(() => buildTree(categories), [categories])
  const toggleExpand = (id: string) => setExpanded(prev => (prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]))

  // ---------- CRUD ----------
  const handleCreate = async () => {
    if (!inputTitle.trim()) return
    setLoading(true)
    try {
      await fetch('/api/categories/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: inputTitle, parent: selectedId }) })
      const updated = await client.fetch(`*[_type == "category"] | order(order asc){_id, title, parent->{_id, title}, order}`)
      setCategories(updated)
      if (selectedId) setExpanded(prev => [...new Set([...prev, selectedId])])
    } finally { setLoading(false); setInputTitle('') }
  }

  const handleUpdate = async () => {
    if (!selectedId || !inputTitle.trim()) return
    setLoading(true)
    try {
      await fetch('/api/categories/update', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selectedId, title: inputTitle }) })
      const updated = await client.fetch(`*[_type == "category"] | order(order asc){_id, title, parent->{_id, title}, order}`)
      setCategories(updated)
    } finally { setLoading(false); setInputTitle('') }
  }

  const handleDelete = async () => {
    if (!deleteTargetId) return
    setIsProcessing(true)
    try {
      await fetch('/api/categories/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: deleteTargetId }) })
      const updated = await client.fetch(`*[_type == "category"] | order(order asc){_id, title, parent->{_id, title}, order}`)
      setCategories(updated)
      if (selectedId === deleteTargetId) setSelectedId(null)
      setShowDeleteModal(false)
    } catch (err) { console.error(err); alert('Failed to delete category') }
    finally { setIsProcessing(false); setDeleteTargetId(null) }
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

    await fetch('/api/categories/reorder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parent: parentId, order: newOrder.map((c, i) => ({ id: c._id, order: i })) }) })
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Category Manager</h1>

      <div ref={controlsRef} className={styles.controls}>
        <input className={styles.input} placeholder={selectedId ? 'Edit or add subcategory' : 'Add new top-level category'} value={inputTitle} onChange={e => setInputTitle(e.target.value)} />
        <button onClick={handleCreate} disabled={!inputTitle.trim()}>Add</button>
        <button onClick={() => { if (!selectedId) return; setDeleteTargetId(selectedId); setShowDeleteModal(true) }} disabled={!selectedId}>Delete</button>
        <button onClick={handleUpdate} disabled={!selectedId || !inputTitle.trim()}>Update</button>
      </div>

      <div ref={treeRef}>
        <SortableTree nodes={tree} expanded={expanded} toggleExpand={toggleExpand} selectedId={selectedId} setSelectedId={setSelectedId} onReorder={handleReorder} />
      </div>

      {loading && <p className={styles.loading}>Working...</p>}

      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            {isProcessing ? (
              <>
                <h2>Deleting...</h2>
                <div className={styles.spinner}></div>
              </>
            ) : (
              <>
                <h2>Confirm Deletion</h2>
                <p>This action cannot be undone. Are you sure you want to delete this category?</p>
                <div className={styles.modalButtons}>
                  <button className={styles.cancelBtn} onClick={() => setShowDeleteModal(false)}>Cancel</button>
                  <button className={styles.dangerBtn} onClick={e => { e.stopPropagation(); handleDelete() }} disabled={isProcessing}>Delete</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- Server-Side Fetch ----------
export async function getServerSideProps() {
  const initialCategories: Category[] = await client.fetch(`
    *[_type == "category"] | order(order asc){
      _id,
      title,
      parent->{_id, title},
      order
    }
  `)
  return { props: { initialCategories } }
}