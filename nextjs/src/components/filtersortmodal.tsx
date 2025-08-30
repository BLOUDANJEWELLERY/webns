'use client'

import { useState, useMemo, useEffect } from 'react'
import styles from '../styles/filter.module.css'

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

interface FilterSortSidebarProps {
  initialCategories: CategoryRaw[]
  initialSelectedCategories?: string[]
  initialSelectedColors?: string[]
  initialSelectedSizes?: string[]
  initialMinPrice?: number
  initialMaxPrice?: number
  initialSort?: SortOption
  open: boolean
  onApply?: (filters: {
    categories: string[]
    colors: string[]
    sizes: string[]
    minPrice: number
    maxPrice: number
    sort: SortOption
  }) => void
  onClose?: () => void
}

const HARD_CODED_COLORS = [
  'Red','Green','Blue','Yellow','White','Black',
  'Brown','Orange','Purple','Pink','Gray','Beige'
]

const HARD_CODED_SIZES = [
  'XXS','XS','S','M','L','XL','XXL','XXXL'
]

export default function FilterSortSidebar({
  initialCategories,
  initialSelectedCategories = [],
  initialSelectedColors = [],
  initialSelectedSizes = [],
  initialMinPrice = 0,
  initialMaxPrice = 100,
  initialSort = 'relevance',
  open,
  onApply,
  onClose,
}: FilterSortSidebarProps) {
  // ----- States -----
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialSelectedCategories)
  const [selectedColors, setSelectedColors] = useState<string[]>(initialSelectedColors)
  const [selectedSizes, setSelectedSizes] = useState<string[]>(initialSelectedSizes)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [minPrice, setMinPrice] = useState(initialMinPrice)
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice)
  const [sort, setSort] = useState<SortOption>(initialSort)

  // ----- Category Tree & Parent Map -----
  const { categoryTree, parentMap } = useMemo(() => {
    const map: Record<string, CategoryNode> = {}
    const roots: CategoryNode[] = []
    const parentMap: Record<string, string | null> = {}

    initialCategories?.forEach(cat => {
      map[cat._id] = { ...cat, children: [] }
      parentMap[cat._id] = cat.parent?._id || null
    })

    initialCategories?.forEach(cat => {
      if (cat.parent?._id) map[cat.parent._id]?.children.push(map[cat._id])
      else roots.push(map[cat._id])
    })

    const sortTree = (nodes: CategoryNode[]) => {
      nodes.sort((a, b) => (a.order || 0) - (b.order || 0))
      nodes.forEach(n => sortTree(n.children))
    }
    sortTree(roots)

    return { categoryTree: roots, parentMap }
  }, [initialCategories])

  // ----- Expand parents of selected categories -----
  useEffect(() => {
    const newExpanded = new Set<string>()
    selectedCategories.forEach(catId => {
      let current = catId
      while (parentMap[current]) {
        newExpanded.add(parentMap[current]!)
        current = parentMap[current]!
      }
    })
    setExpandedCategories(newExpanded)
  }, [selectedCategories, parentMap])

  const handleToggle = (value: string, selected: string[], setSelected: React.Dispatch<React.SetStateAction<string[]>>) => {
    setSelected(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value])
  }

  const handleReset = () => {
    setSelectedCategories([])
    setSelectedColors([])
    setSelectedSizes([])
    setMinPrice(initialMinPrice)
    setMaxPrice(initialMaxPrice)
    setSort(initialSort)
    setExpandedCategories(new Set())
  }

  const handleApply = () => {
    onApply?.({
      categories: selectedCategories,
      colors: selectedColors,
      sizes: selectedSizes,
      minPrice,
      maxPrice,
      sort,
    })
    onClose?.()
  }

  // ----- Recursive Category Component -----
  const CategoryNodeItem = ({ node }: { node: CategoryNode }) => {
    const isExpanded = expandedCategories.has(node._id)
    return (
      <div>
        <div className={styles.categoryRow}>
          {node.children.length > 0 && (
            <button type="button" className={styles.toggleBtn} onClick={() => {
              setExpandedCategories(prev => {
                const next = new Set(prev)
                next.has(node._id) ? next.delete(node._id) : next.add(node._id)
                return next
              })
            }}>
              {isExpanded ? '▾' : '▸'}
            </button>
          )}
          <label>
            <input
              type="checkbox"
              checked={selectedCategories.includes(node._id)}
              onChange={() => handleToggle(node._id, selectedCategories, setSelectedCategories)}
            />
            <span>{node.title}</span>
          </label>
        </div>
        {isExpanded && node.children.length > 0 && (
          <div className={styles.nested}>
            {node.children.map(child => <CategoryNodeItem key={child._id} node={child} />)}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div className={`${styles.backdrop} ${open ? styles.show : ''}`} onClick={onClose}></div>

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${open ? styles.open : ''}`}>
        <header className={styles.sidebarHeader}>
          <h3>Filter & Sort</h3>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </header>

        <div className={styles.sidebarContent}>
          {/* Categories */}
          <section className={styles.section}>
            <h4>Categories</h4>
            <label>
              <input type="checkbox" checked={selectedCategories.length === 0} onChange={() => setSelectedCategories([])} />
              All Categories
            </label>
            {categoryTree.map(node => <CategoryNodeItem key={node._id} node={node} />)}
          </section>

          {/* Colors */}
          <section className={styles.section}>
            <h4>Colors</h4>
            <div className={styles.circleGrid}>
              <button onClick={() => setSelectedColors([])} className={selectedColors.length === 0 ? styles.activeCircle : ''}>All</button>
              {HARD_CODED_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => handleToggle(color, selectedColors, setSelectedColors)}
                  className={selectedColors.includes(color) ? styles.activeCircle : ''}
                  style={{ backgroundColor: color.toLowerCase() }}
                />
              ))}
            </div>
          </section>

          {/* Sizes */}
          <section className={styles.section}>
            <h4>Sizes</h4>
            <div className={styles.circleGrid}>
              <button onClick={() => setSelectedSizes([])} className={selectedSizes.length === 0 ? styles.activeCircle : ''}>All</button>
              {HARD_CODED_SIZES.map(size => (
                <button
                  key={size}
                  onClick={() => handleToggle(size, selectedSizes, setSelectedSizes)}
                  className={selectedSizes.includes(size) ? styles.activeCircle : ''}
                >
                  {size}
                </button>
              ))}
            </div>
          </section>

          {/* Sort */}
          <section className={styles.section}>
            <h4>Sort By</h4>
            <select value={sort} onChange={e => setSort(e.target.value as SortOption)}>
              <option value="alphabeticalAZ">A-Z</option>
              <option value="alphabeticalZA">Z-A</option>
              <option value="priceLowHigh">Price: Low to High</option>
              <option value="priceHighLow">Price: High to Low</option>
              <option value="relevance">Relevance</option>
            </select>
          </section>
        </div>

        <footer className={styles.sidebarFooter}>
          <button className={styles.resetBtn} onClick={handleReset}>Reset</button>
          <button className={styles.applyBtn} onClick={handleApply}>Apply</button>
        </footer>
      </aside>
    </>
  )
}