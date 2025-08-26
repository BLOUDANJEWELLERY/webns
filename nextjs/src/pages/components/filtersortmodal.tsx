// src/pages/components/FilterSortModal.tsx
import React, { useState, useMemo, useEffect } from "react";
import styles from "../../styles/adminEdit.module.css";
import { createClient } from "next-sanity";

// ------------------- Types -------------------
interface CategoryRaw {
  _id: string;
  title: string;
  parent?: { _id: string; title: string };
  order?: number;
}

interface CategoryNode extends CategoryRaw {
  children: CategoryNode[];
}

type SortOption = "alphabetical" | "priceAsc" | "priceDesc";

type Props = {
  isOpen: boolean;
  initialMinPrice?: number | "";
  initialMaxPrice?: number | "";
  initialSort?: SortOption;
  onClose: () => void;
  onApply: (filters: {
    selectedCategories: string[];
    minPrice: number | "";
    maxPrice: number | "";
    sort: SortOption;
  }) => void;
};

// ------------------- Sanity Client -------------------
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2023-08-01",
  useCdn: false,
});

// ------------------- Component -------------------
const FilterSortModal: React.FC<Props> = ({
  isOpen,
  initialMinPrice = "",
  initialMaxPrice = "",
  initialSort = "alphabetical",
  onClose,
  onApply,
}) => {
  const [categories, setCategories] = useState<CategoryRaw[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [minPrice, setMinPrice] = useState<number | "">(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState<number | "">(initialMaxPrice);
  const [sort, setSort] = useState<SortOption>(initialSort);

  // ------------------- Fetch Categories -------------------
  useEffect(() => {
    async function fetchCategories() {
      try {
        const cats: CategoryRaw[] = await client.fetch(`
          *[_type=="category"]{
            _id,
            title,
            parent->{_id, title},
            order
          } | order(order asc)
        `);
        setCategories(cats);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    }

    if (isOpen) fetchCategories(); // fetch only when modal opens
  }, [isOpen]);

  // ------------------- Category Tree -------------------
  const toggleCategoryExpand = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCategoryToggle = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const buildCategoryTree = (cats: CategoryRaw[] = []): CategoryNode[] => {
    const map: Record<string, CategoryNode> = {};
    const roots: CategoryNode[] = [];

    cats.forEach((cat) => (map[cat._id] = { ...cat, children: [] }));
    cats.forEach((cat) => {
      if (cat.parent?._id) map[cat.parent._id].children.push(map[cat._id]);
      else roots.push(map[cat._id]);
    });

    const sortTree = (nodes: CategoryNode[]) => {
      nodes.sort((a, b) => (a.order || 0) - (b.order || 0));
      nodes.forEach((n) => sortTree(n.children));
    };
    sortTree(roots);
    return roots;
  };

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

  const renderCategoryNode = (node: CategoryNode): React.ReactElement => {
    const isExpanded = expandedCategories.has(node._id);
    return (
      <div key={node._id}>
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
            {node.children.map((child) => renderCategoryNode(child))}
          </div>
        )}
      </div>
    );
  };

  // ------------------- Apply Filters -------------------
  const handleApply = () => {
    onApply({ selectedCategories, minPrice, maxPrice, sort });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>Filter & Sort</h2>

        {/* Categories */}
        <div className={styles.checkboxGroup}>
          <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Categories</p>
          {categoryTree.length === 0 ? (
            <p>Loading categories...</p>
          ) : (
            categoryTree.map((node) => renderCategoryNode(node))
          )}
        </div>

        {/* Price Range */}
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
          <input
            type="number"
            placeholder="Min"
            className={styles.input}
            value={minPrice}
            onChange={(e) =>
              setMinPrice(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
          <input
            type="number"
            placeholder="Max"
            className={styles.input}
            value={maxPrice}
            onChange={(e) =>
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
  );
};

export default FilterSortModal;