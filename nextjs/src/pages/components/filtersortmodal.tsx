'use client'

import { useState, useMemo } from 'react'
import styles from '../../styles/filter.module.css'

// ----- Types -----
interface CategoryRaw {
  _id: string
  title: string
  parent?: { _id: string; title: string }
  order?: number
}

interface CategoryNode extends CategoryRaw {
  children: CategoryNode[]
}

type SortOption =
  | 'alphabeticalAZ'
  | 'alphabeticalZA'
  | 'priceLowHigh'
  | 'priceHighLow'
  | 'relevance'
  | 'others'

interface FilterSortModalProps {
  initialCategories: CategoryRaw[]
  initialMinPrice?: number
  initialMaxPrice?: number
  initialSort?: SortOption
  maxPriceLimit?: number
  onApply?: (filters: {
    categories: string[]
    minPrice: number
    maxPrice: number
    sort: SortOption
  }) => void
  onClose?: () => void
}

// ----- Component -----
export default function FilterSortModal({
  initialCategories,
  initialMinPrice = 0,
  initialMaxPrice = 1000,
  maxPriceLimit = 1000,
  initialSort = 'alphabeticalAZ',
  onApply,
  onClose,
}: FilterSortModalProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [minPrice, setMinPrice] = useState<number>(initialMinPrice)
  const [maxPrice, setMaxPrice] = useState<number>(initialMaxPrice)
  const [sort, setSort] = useState<SortOption>(initialSort)

  // ----- Build category tree -----
  const categoryTree = useMemo(() => {
    if (!initialCategories) return []

    const map: Record<string, CategoryNode> = {}
    const roots: CategoryNode[] = []

    initialCategories.forEach(cat => { map[cat._id] = { ...cat, children: [] } })
    initialCategories.forEach(cat => {
      if (cat.parent?._id) map[cat.parent._id]?.children.push(map[cat._id])
      else roots.push(map[cat._id])
    })

    const sortTree = (nodes: CategoryNode[]) => {
      nodes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      nodes.forEach(n => sortTree(n.children))
    }
    sortTree(roots)
    return roots
  }, [initialCategories])

  // ----- Handlers -----
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

  const handleApply = () => {
    onApply?.({
      categories: selectedCategories,
      minPrice,
      maxPrice,
      sort,
    })
    onClose?.()
  }

  // ----- Recursive renderer -----
  const CategoryNodeItem = ({ node }: { node: CategoryNode }) => {
    const isExpanded = expandedCategories.has(node._id)
    return (
      <div className={styles.categoryNode}>
        <div className={styles.categoryRow}>
          {node.children.length > 0 && (
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => toggleCategoryExpand(node._id)}
            >
              {isExpanded ? '▾' : '▸'}
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
      <h3 className={styles.modalTitle}>Filter & Sort</h3>

      {/* Categories */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Categories</h4>
        {categoryTree.length === 0 ? (
          <p>No categories found.</p>
        ) : (
          categoryTree.map(node => <CategoryNodeItem key={node._id} node={node} />)
        )}
      </section>

      {/* Price Range Sliders */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Price Range</h4>
        <div className={styles.sliderContainer}>
          <input
            type="range"
            min={0}
            max={maxPriceLimit}
            value={minPrice}
            onChange={e => setMinPrice(Number(e.target.value))}
            className={styles.rangeSlider}
          />
          <input
            type="range"
            min={0}
            max={maxPriceLimit}
            value={maxPrice}
            onChange={e => setMaxPrice(Number(e.target.value))}
            className={styles.rangeSlider}
          />
          <div className={styles.sliderValues}>
            <span>{minPrice}</span> - <span>{maxPrice}</span>
          </div>
        </div>
      </section>

      {/* Sorting */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Sort By</h4>
        <select
          className={styles.sortSelect}
          value={sort}
          onChange={e => setSort(e.target.value as SortOption)}
        >
          <option value="alphabeticalAZ">A → Z</option>
          <option value="alphabeticalZA">Z → A</option>
          <option value="priceLowHigh">Price: Low → High</option>
          <option value="priceHighLow">Price: High → Low</option>
          <option value="relevance">Relevance</option>
          <option value="others">Others</option>
        </select>
      </section>

      {/* Buttons */}
      <div className={styles.buttons}>
        <button className={styles.applyBtn} onClick={handleApply}>Apply</button>
        <button className={styles.closeBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  )
}