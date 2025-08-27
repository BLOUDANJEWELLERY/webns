import { useState, useMemo } from "react"
import styles from "../../styles/header.module.css"

// Raw category type from Sanity
interface CategoryRaw {
  _id: string
  title: string
  parent?: { _id: string; title: string }
  order?: number
}

// Category tree node
interface CategoryNode extends CategoryRaw {
  children: CategoryNode[]
}

interface FilterSortModalProps {
  initialCategories: CategoryRaw[]
}

const FilterSortModal: React.FC<FilterSortModalProps> = ({ initialCategories }) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Build category tree
  const buildCategoryTree = (cats: CategoryRaw[]): CategoryNode[] => {
    const map: Record<string, CategoryNode> = {}
    const roots: CategoryNode[] = []

    cats.forEach(cat => { map[cat._id] = { ...cat, children: [] } })
    cats.forEach(cat => {
      if (cat.parent?._id) map[cat.parent._id]?.children.push(map[cat._id])
      else roots.push(map[cat._id])
    })

    const sortTree = (nodes: CategoryNode[]) => {
      nodes.sort((a, b) => (a.order || 0) - (b.order || 0))
      nodes.forEach(n => sortTree(n.children))
    }
    sortTree(roots)
    return roots
  }

  const categoryTree = useMemo(() => buildCategoryTree(initialCategories), [initialCategories])

  // Handlers
  const toggleCategoryExpand = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleCategoryToggle = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  // Render tree
  const CategoryNodeItem: React.FC<{ node: CategoryNode }> = ({ node }) => {
    const isExpanded = expandedCategories.has(node._id)
    return (
      <div>
        <div className={styles.categoryRow}>
          {node.children.length > 0 && (
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => toggleCategoryExpand(node._id)}
            >
              {isExpanded ? "▾" : "▸"}
            </button>
          )}
          <label>
            <input
              type="checkbox"
              checked={selectedCategories.includes(node._id)}
              onChange={() => handleCategoryToggle(node._id)}
            />
            {node.title}
          </label>
        </div>
        {isExpanded && node.children.length > 0 && (
          <div className={styles.nested}>
            {node.children.map(child => (
              <CategoryNodeItem key={child._id} node={child} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.modal}>
      <h3>Filter by Category</h3>
      {categoryTree.length === 0 ? (
        <p>No categories found.</p>
      ) : (
        categoryTree.map(node => (
          <CategoryNodeItem key={node._id} node={node} />
        ))
      )}
    </div>
  )
}

export default FilterSortModal