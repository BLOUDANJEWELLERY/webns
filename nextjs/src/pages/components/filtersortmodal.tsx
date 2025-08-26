import { useState } from "react";
import styles from "../styles/adminEdit.module.css";

type Category = { _id: string; title: string };

type Props = {
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: { category?: string; sort?: string; minPrice?: number; maxPrice?: number }) => void;
};

export default function FilterSortModal({ categories, isOpen, onClose, onApply }: Props) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortOption, setSortOption] = useState("alphabetical");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");

  if (!isOpen) return null;

  const handleApply = () => {
    onApply({
      category: selectedCategory || undefined,
      sort: sortOption,
      minPrice: minPrice !== "" ? Number(minPrice) : undefined,
      maxPrice: maxPrice !== "" ? Number(maxPrice) : undefined,
    });
    onClose();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>Filter & Sort</h2>

        {/* Category */}
        <label className={styles.label}>Category</label>
        <select
          className={styles.input}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat.title}>
              {cat.title}
            </option>
          ))}
        </select>

        {/* Sort */}
        <label className={styles.label}>Sort By</label>
        <select
          className={styles.input}
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
        >
          <option value="alphabetical">Alphabetical</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>

        {/* Price Range */}
        <label className={styles.label}>Price Range</label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="number"
            placeholder="Min"
            className={styles.input}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <input
            type="number"
            placeholder="Max"
            className={styles.input}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>

        {/* Buttons */}
        <div className={styles.modalButtons}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.confirmBtn} onClick={handleApply}>Apply</button>
        </div>
      </div>
    </div>
  );
}