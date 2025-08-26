// src/pages/components/FilterSortModal.tsx
import React, { useState } from "react"
import styles from "../../styles/adminEdit.module.css"

type Category = {
  _id: string
  title: string
}

type Props = {
  isOpen: boolean
  categories: Category[]
  initialMinPrice?: number | ""
  initialMaxPrice?: number | ""
  initialSort?: "alphabetical" | "priceAsc" | "priceDesc"
  onClose: () => void
  onApply: (filters: {
    selectedCategories: string[]
    minPrice: number | ""
    maxPrice: number | ""
    sort: "alphabetical" | "priceAsc" | "priceDesc"
  }) => void
}

const FilterSortModal: React.FC<Props> = ({
  isOpen,
  categories,
  initialMinPrice = "",
  initialMaxPrice = "",
  initialSort = "alphabetical",
  onClose,
  onApply,
}) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [minPrice, setMinPrice] = useState<number | "">(initialMinPrice)
  const [maxPrice, setMaxPrice] = useState<number | "">(initialMaxPrice)
  const [sort, setSort] = useState<typeof initialSort>(initialSort)

  if (!isOpen) return null

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const handleApply = () => {
    onApply({ selectedCategories, minPrice, maxPrice, sort })
    onClose()
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>Filter & Sort</h2>

        {/* Categories */}
        <div className={styles.checkboxGroup}>
          <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Categories</p>
          {categories.map(cat => (
            <label key={cat._id}>
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat._id)}
                onChange={() => toggleCategory(cat._id)}
              />
              {cat.title}
            </label>
          ))}
        </div>

        {/* Price Range */}
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
          <input
            type="number"
            placeholder="Min"
            className={styles.input}
            value={minPrice}
            onChange={e =>
              setMinPrice(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
          <input
            type="number"
            placeholder="Max"
            className={styles.input}
            value={maxPrice}
            onChange={e =>
              setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </div>

        {/* Sort Options */}
        <div style={{ marginTop: "1rem" }}>
          <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Sort By</p>
          <label>
            <input
              type="radio"
              name="sort"
              value="alphabetical"
              checked={sort === "alphabetical"}
              onChange={() => setSort("alphabetical")}
            />
            Alphabetical
          </label>
          <br />
          <label>
            <input
              type="radio"
              name="sort"
              value="priceAsc"
              checked={sort === "priceAsc"}
              onChange={() => setSort("priceAsc")}
            />
            Price: Low → High
          </label>
          <br />
          <label>
            <input
              type="radio"
              name="sort"
              value="priceDesc"
              checked={sort === "priceDesc"}
              onChange={() => setSort("priceDesc")}
            />
            Price: High → Low
          </label>
        </div>

        {/* Buttons */}
        <div className={styles.modalButtons}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.confirmBtn} onClick={handleApply}>
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

export default FilterSortModal