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
const [activeThumb, setActiveThumb] = useState<'min' | 'max' | null>(null)

const minPricePercent = (minPrice / 10000) * 100
const maxPricePercent = (maxPrice / 10000) * 100

const startDrag = (e: React.MouseEvent | React.TouchEvent, thumb: 'min' | 'max') => {
  e.preventDefault() // prevent text selection or scrolling
  setActiveThumb(thumb)
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
  window.addEventListener('touchmove', onDrag, { passive: false })
  window.addEventListener('touchend', stopDrag)
}

const onDrag = (e: MouseEvent | TouchEvent) => {
  if (!activeThumb) return
  e.preventDefault()
  const sliderRect = document.querySelector(`.${styles.sliderContainer}`)?.getBoundingClientRect()
  if (!sliderRect) return
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  let percent = ((clientX - sliderRect.left) / sliderRect.width) * 100
  percent = Math.max(0, Math.min(100, percent))
  const value = Math.round((percent / 100) * 10000)

  if (activeThumb === 'min') setMinPrice(Math.min(value, maxPrice))
  else setMaxPrice(Math.max(value, minPrice))
}

const stopDrag = () => {
  setActiveThumb(null)
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
  window.removeEventListener('touchmove', onDrag)
  window.removeEventListener('touchend', stopDrag)
}

// click/tap anywhere to move nearest thumb
const handleSliderClick = (e: React.MouseEvent | React.TouchEvent) => {
  e.preventDefault()
  const sliderRect = e.currentTarget.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const percent = ((clientX - sliderRect.left) / sliderRect.width) * 100
  const value = Math.round((percent / 100) * 10000)
  if (Math.abs(value - minPrice) < Math.abs(value - maxPrice)) setMinPrice(Math.min(value, maxPrice))
  else setMaxPrice(Math.max(value, minPrice))
}


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
<section className={styles.section}>
  <h4 className={styles.sectionTitle}>Price Range</h4>
  <div
    className={styles.sliderContainer}
    onMouseDown={handleSliderClick}
    onTouchStart={handleSliderClick}
  >
    {/* Track */}
    <div className={styles.rangeTrack}></div>
    <div
      className={styles.rangeTrackActive}
      style={{ left: `${minPricePercent}%`, right: `${100 - maxPricePercent}%` }}
    ></div>

    {/* Thumbs */}
    <div
      className={styles.thumb}
      style={{ left: `${minPricePercent}%` }}
      onMouseDown={e => startDrag(e, 'min')}
      onTouchStart={e => startDrag(e, 'min')}
    />
    <div
      className={styles.thumb}
      style={{ left: `${maxPricePercent}%` }}
      onMouseDown={e => startDrag(e, 'max')}
      onTouchStart={e => startDrag(e, 'max')}
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