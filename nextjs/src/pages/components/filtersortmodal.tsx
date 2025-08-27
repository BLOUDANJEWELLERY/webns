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

interface FilterSortModalProps {
  initialCategories: CategoryRaw[]
  initialMinPrice?: number
  initialMaxPrice?: number
  initialSort?: SortOption
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

// ----- Hardcoded Filters -----
const HARD_CODED_COLORS = [
  'Red','Green','Blue','Yellow','White','Black',
  'Brown','Orange','Purple','Pink','Gray','Beige'
]

const HARD_CODED_SIZES = [
  'XXS','XS','S','M','L','XL','XXL','XXXL'
]

// ----- Component -----
export default function FilterSortModal({
  initialCategories,
  initialMinPrice = 0,
  initialMaxPrice = 1000,
  initialSort = 'alphabeticalAZ',
  onApply,
  onClose,
}: FilterSortModalProps) {

  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [minPrice, setMinPrice] = useState<number>(initialMinPrice)
  const [maxPrice, setMaxPrice] = useState<number>(initialMaxPrice)
  const [sort, setSort] = useState<SortOption>(initialSort)

  // ----- Build Category Tree -----
  const categoryTree = useMemo(() => {
    if (!initialCategories) return []
    const map: Record<string, CategoryNode> = {}
    const roots: CategoryNode[] = []

    initialCategories.forEach(cat => map[cat._id] = {...cat, children: []})
    initialCategories.forEach(cat => {
      if (cat.parent?._id) map[cat.parent._id]?.children.push(map[cat._id])
      else roots.push(map[cat._id])
    })

    const sortTree = (nodes: CategoryNode[]) => {
      nodes.sort((a,b) => (a.order||0) - (b.order||0))
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

  const handleToggle = (
    value: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setSelected(selected.includes(value) ? selected.filter(v => v!==value) : [...selected, value])
  }

  const handleApply = () => {
    onApply?.({
      categories: selectedCategories,
      colors: selectedColors,
      sizes: selectedSizes,
      minPrice,
      maxPrice,
      sort
    })
    onClose?.()
  }

  // ----- Recursive Category Renderer -----
  const CategoryNodeItem = ({node}: {node: CategoryNode}) => {
    const isExpanded = expandedCategories.has(node._id)
    return (
      <div className={styles.categoryNode}>
        <div className={styles.categoryRow}>
          {node.children.length>0 && (
            <button type="button" className={styles.toggleBtn} onClick={()=>toggleCategoryExpand(node._id)}>
              {isExpanded ? '▾' : '▸'}
            </button>
          )}
          <label>
            <input
              type="checkbox"
              checked={selectedCategories.includes(node._id)}
              onChange={()=>handleToggle(node._id, selectedCategories, setSelectedCategories)}
            />
            {node.title}
          </label>
        </div>
        {isExpanded && node.children.length>0 && (
          <div className={styles.nested}>
            {node.children.map(child=><CategoryNodeItem key={child._id} node={child}/>)}
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
        {categoryTree.length===0 ? <p>No categories found.</p> :
          categoryTree.map(node=><CategoryNodeItem key={node._id} node={node}/>)}
      </section>

      {/* Price Slider */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Price Range</h4>
        <div className={styles.sliderContainer}>
          <div className={styles.rangeTrack}></div>
          <input
            type="range"
            min={0} max={10000}
            value={minPrice}
            onChange={e=>setMinPrice(Math.min(Number(e.target.value), maxPrice))}
            className={`${styles.rangeSlider} ${styles.minSlider}`}
          />
          <input
            type="range"
            min={0} max={10000}
            value={maxPrice}
            onChange={e=>setMaxPrice(Math.max(Number(e.target.value), minPrice))}
            className={`${styles.rangeSlider} ${styles.maxSlider}`}
          />
          <div className={styles.sliderValues}>
            <span>{minPrice} KWD</span>
            <span>{maxPrice} KWD</span>
          </div>
        </div>
      </section>

      {/* Colors */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Colors</h4>
        <div className={styles.circleGrid}>
          {HARD_CODED_COLORS.map(color=>(
            <button
              key={color}
              type="button"
              className={`${styles.colorCircle} ${selectedColors.includes(color)?styles.activeCircle:''}`}
              style={{backgroundColor: color.toLowerCase()}}
              onClick={()=>handleToggle(color, selectedColors, setSelectedColors)}
              title={color}
            />
          ))}
        </div>
      </section>

      {/* Sizes */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Sizes</h4>
        <div className={styles.circleGrid}>
          {HARD_CODED_SIZES.map(size=>(
            <button
              key={size}
              type="button"
              className={`${styles.sizeCircle} ${selectedSizes.includes(size)?styles.activeCircle:''}`}
              onClick={()=>handleToggle(size, selectedSizes, setSelectedSizes)}
            >
              {size}
            </button>
          ))}
        </div>
      </section>

      {/* Sort */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Sort By</h4>
        <select
          className={styles.sortSelect}
          value={sort}
          onChange={e=>setSort(e.target.value as SortOption)}
        >
          <option value="alphabeticalAZ">A-Z</option>
          <option value="alphabeticalZA">Z-A</option>
          <option value="priceLowHigh">Price: Low to High</option>
          <option value="priceHighLow">Price: High to Low</option>
          <option value="relevance">Relevance</option>
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