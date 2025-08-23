import { useState, useMemo } from 'react'
import styles from '../../styles/admincat.module.css'
import { client } from '../../lib/sanityClient'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'

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

// Build tree
const buildTree = (cats: CategoryRaw[] = []): CategoryNode[] => {
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

export default function CategoriesPage({ categories: initialCategories }: { categories: CategoryRaw[] }) {
  const [catList, setCatList] = useState<CategoryRaw[]>(initialCategories || [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [inputTitle, setInputTitle] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const tree = useMemo(() => buildTree(catList), [catList])

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
      setCatList(prev => prev.map(c => (c._id === selectedId ? { ...c, title: inputTitle } : c)))
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

  // ---------- Drag & Drop ----------
  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const newList = [...catList]
    const [moved] = newList.splice(result.source.index, 1)
    newList.splice(result.destination.index, 0, moved)

    // Update local state immediately
    setCatList(newList)

    // Persist new order to backend
    try {
      await fetch('/api/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent: moved.parent?._id ?? null,
          order: newList.map((c, i) => ({ id: c._id, order: i })),
        }),
      })
    } catch (err) {
      console.error('Failed to reorder', err)
      alert('Failed to save new order')
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

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="categories">
          {provided => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {catList.map((cat, index) => (
                <Draggable key={cat._id} draggableId={cat._id} index={index}>
                  {providedDraggable => (
                    <div
                      ref={providedDraggable.innerRef}
                      {...providedDraggable.draggableProps}
                      {...providedDraggable.dragHandleProps}
                      className={selectedId === cat._id ? styles.nodeSelected : styles.node}
                      onClick={() => setSelectedId(cat._id)}
                    >
                      {cat.title}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
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
    props: { categories: categories || [] },
  }
}