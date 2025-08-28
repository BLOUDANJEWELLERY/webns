'use client'

import { useState, useMemo } from 'react'
import styles from '../../styles/filter.module.css'

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

const HARD_CODED_COLORS = [
  'Red','Green','Blue','Yellow','White','Black',
  'Brown','Orange','Purple','Pink','Gray','Beige'
]

const HARD_CODED_SIZES = [
  'XXS','XS','S','M','L','XL','XXL','XXXL'
]

export default function FilterSortModal({
  initialCategories,
  initialMinPrice = 0,
  initialMaxPrice = 100,
  initialSort = 'relevance',
  onApply,
  onClose,
}: FilterSortModalProps) {

  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [sort, setSort] = useState<SortOption>(initialSort)

  // ----- Category Tree -----
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
    setSelected(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value])
  }

  const handleReset = () => {
    setSelectedCategories([])
    setSelectedColors([])
    setSelectedSizes([])
    setMinPrice(initialMinPrice)
    setMaxPrice(initialMaxPrice)
    setSort(initialSort)
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

  // ----- Recursive Category -----
  const CategoryNodeItem = ({ node }: { node: CategoryNode }) => {
    const isExpanded = expandedCategories.has(node._id)
    return (
      <div>
        <div className={styles.categoryRow}>
          {node.children.length > 0 && (
            <button type="button" className={styles.toggleBtn} onClick={() => toggleCategoryExpand(node._id)}>
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

  // Slider percentages
// State
const [minPrice, setMinPrice] = useState(1)
const [maxPrice, setMaxPrice] = useState(100)
const [activeThumb, setActiveThumb] = useState<'min' | 'max' | null>(null)

// Input field state (can be null while user is typing)
const [minInput, setMinInput] = useState<number | null>(minPrice)
const [maxInput, setMaxInput] = useState<number | null>(maxPrice)


const startDrag = (e: React.MouseEvent | React.TouchEvent, thumb: 'min' | 'max') => {
  e.preventDefault()
  setActiveThumb(thumb)

  const move = (ev: MouseEvent | TouchEvent) => {
    const slider = document.querySelector(`.${styles.sliderContainer}`)?.getBoundingClientRect()
    if (!slider) return
    const clientX = 'touches' in ev ? ev.touches[0].clientX : ev.clientX
    let percent = ((clientX - slider.left) / slider.width) * 100
    percent = Math.max(0, Math.min(100, percent))
    const value = Math.round(percent)
    if (thumb === 'min') setMinPrice(Math.min(value, maxPrice))
    else setMaxPrice(Math.max(value, minPrice))
  }

  const stop = () => {
    setActiveThumb(null)
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', stop)
    window.removeEventListener('touchmove', move)
    window.removeEventListener('touchend', stop)
  }

  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', stop)
  window.addEventListener('touchmove', move, { passive: false })
  window.addEventListener('touchend', stop)
}

// Click anywhere on slider to move nearest thumb
const handleSliderClick = (e: React.MouseEvent | React.TouchEvent) => {
  e.preventDefault()
  const slider = e.currentTarget.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const percent = ((clientX - slider.left) / slider.width) * 100
  const value = Math.round(percent)
  if (Math.abs(value - minPrice) < Math.abs(value - maxPrice)) {
    setMinPrice(Math.min(value, maxPrice))
  } else {
    setMaxPrice(Math.max(value, minPrice))
  }
}

const minPercent = minPrice
const maxPercent = maxPrice


  return (
    <div className={styles.modal}>
      <h3 className={styles.modalTitle}>Filter & Sort</h3>

      <div style={{textAlign:'right', marginBottom:'0.75rem'}}>
        <button className={styles.resetBtn} onClick={handleReset}>Reset</button>
      </div>

      {/* Categories */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Categories</h4>
        <div className={styles.checkboxGroup}>
          <label className={styles.customCheckboxLabel}>
            <input
              type="checkbox"
              checked={selectedCategories.length === 0}
              onChange={() => setSelectedCategories([])}
            />
            <span>All Categories</span>
          </label>
          {categoryTree.length === 0 ? <p>No categories found.</p> :
            categoryTree.map(node => <CategoryNodeItem key={node._id} node={node} />)}
        </div>
      </section>

{/* Price Slider */}
{/* Slider container */}
<div
  className={styles.sliderContainer}
  onMouseDown={handleSliderClick}
  onTouchStart={handleSliderClick}
>
  <div className={styles.rangeTrack}></div>
  <div
    className={styles.rangeTrackActive}
    style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
  ></div>

  {/* Min Thumb */}
  <div
    className={styles.thumb}
    style={{ left: `${minPercent}%`, zIndex: activeThumb === 'min' ? 4 : 2 }}
    onMouseDown={e => startDrag(e, 'min')}
    onTouchStart={e => startDrag(e, 'min')}
  />

  {/* Max Thumb */}
  <div
    className={styles.thumb}
    style={{ left: `${maxPercent}%`, zIndex: activeThumb === 'max' ? 4 : 2 }}
    onMouseDown={e => startDrag(e, 'max')}
    onTouchStart={e => startDrag(e, 'max')}
  />
</div>


<div className={styles.sliderValues}>
  <input
    type="number"
    min={0}
    max={maxPrice}
    value={minInput}
    onClick={e => e.stopPropagation()}
    onMouseDown={e => e.stopPropagation()}
    onTouchStart={e => e.stopPropagation()}
    onChange={(e) => setMinInput(Number(e.target.value))}
    onBlur={() => {
      let val = Math.max(0, Math.min(minInput, maxPrice))
      setMinPrice(val)
      setMinInput(val)
    }}
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        e.currentTarget.blur() // trigger blur logic on Enter
      }
    }}
  />
  <input
    type="number"
    min={minPrice}
    max={100}
    value={maxInput}
    onClick={e => e.stopPropagation()}
    onMouseDown={e => e.stopPropagation()}
    onTouchStart={e => e.stopPropagation()}
    onChange={(e) => setMaxInput(Number(e.target.value))}
    onBlur={() => {
      let val = Math.max(minPrice, Math.min(maxInput, 100))
      setMaxPrice(val)
      setMaxInput(val)
    }}
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        e.currentTarget.blur()
      }
    }}
  />
</div>


      {/* Colors */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Colors</h4>
        <div className={styles.circleGrid}>
          <button
            className={`${styles.colorCircle} ${selectedColors.length === 0 ? styles.activeCircle : ''}`}
            onClick={() => setSelectedColors([])}
            title="All Colors"
          >All</button>
          {HARD_CODED_COLORS.map(color => (
            <button
              key={color}
              type="button"
              className={`${styles.colorCircle} ${selectedColors.includes(color) ? styles.activeCircle : ''}`}
              style={{ backgroundColor: color.toLowerCase() }}
              onClick={() => handleToggle(color, selectedColors, setSelectedColors)}
              title={color}
            />
          ))}
        </div>
      </section>

      {/* Sizes */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Sizes</h4>
        <div className={styles.circleGrid}>
          <button
            className={`${styles.sizeCircle} ${selectedSizes.length === 0 ? styles.activeCircle : ''}`}
            onClick={() => setSelectedSizes([])}
          >All</button>
          {HARD_CODED_SIZES.map(size => (
            <button
              key={size}
              type="button"
              className={`${styles.sizeCircle} ${selectedSizes.includes(size) ? styles.activeCircle : ''}`}
              onClick={() => handleToggle(size, selectedSizes, setSelectedSizes)}
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
          onChange={e => setSort(e.target.value as SortOption)}
        >
          <option value="alphabeticalAZ">A-Z</option>
          <option value="alphabeticalZA">Z-A</option>
          <option value="priceLowHigh">Price: Low to High</option>
          <option value="priceHighLow">Price: High to Low</option>
          <option value="relevance">Relevance</option>
        </select>
      </section>

      <div className={styles.buttons}>
        <button className={styles.applyBtn} onClick={handleApply}>Apply</button>
        <button className={styles.closeBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  )
}