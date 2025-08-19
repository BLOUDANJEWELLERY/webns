// src/pages/admin/categories.tsx
import { useState, useEffect } from "react";
import styles from "../../styles/admincat.module.css";

type SanityCategory = {
  _id: string;
  title: string;
  description?: string;
  parent?: { _id: string; title: string } | null;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<SanityCategory[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [parent, setParent] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch categories via API route
  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories/fetch");
      const data: SanityCategory[] = await res.json();
      setCategories(data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch categories");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSave = async () => {
    if (!title.trim()) return alert("Category name is required");

    setLoading(true);
    try {
      const payload = { title, description, parent: parent || null };

      if (editing) {
        // Update existing category
        const res = await fetch(`/api/categories/update?id=${editing}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed to update category");
        setEditing(null);
      } else {
        // Create new category
        const res = await fetch("/api/categories/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed to create category");
      }

      setTitle("");
      setDescription("");
      setParent("");
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const res = await fetch(`/api/categories/delete?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to delete category");
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert("Failed to delete category");
    }
  };

  const handleEdit = (cat: SanityCategory) => {
    setEditing(cat._id);
    setTitle(cat.title);
    setDescription(cat.description || "");
    setParent(cat.parent?._id || "");
  };

  const renderCategoryTree = (
    cats: SanityCategory[],
    parentId: string | null = null,
    level = 0
  ) =>
    cats
      .filter(c => (c.parent?._id || null) === parentId)
      .map(c => (
        <li key={c._id} className={styles.categoryItem} style={{ marginLeft: `${level * 20}px` }}>
          <div className={styles.categoryRow}>
            <span className={styles.categoryTitle}>{c.title}</span>
            <div className={styles.actionButtons}>
              <button className={styles.editButton} onClick={() => handleEdit(c)}>Edit</button>
              <button className={styles.deleteButton} onClick={() => handleDelete(c._id)}>Delete</button>
            </div>
          </div>
          <ul>{renderCategoryTree(cats, c._id, level + 1)}</ul>
        </li>
      ));

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>{editing ? "Edit Category" : "Create Category"}</h2>

      <div className={styles.formGroup}>
        <input
          className={styles.input}
          placeholder="Category Name"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <textarea
          className={styles.textarea}
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className={styles.formGroup}>
        <select
          className={styles.select}
          value={parent}
          onChange={e => setParent(e.target.value)}
        >
          <option value="">No parent (top-level)</option>
          {categories.map(c => (
            <option key={c._id} value={c._id}>{c.title}</option>
          ))}
        </select>
      </div>

      <button className={styles.saveButton} onClick={handleSave} disabled={loading}>
        {loading ? "Saving..." : editing ? "Update" : "Create"}
      </button>

      <h3 className={styles.subHeading}>Existing Categories</h3>
      {categories.length === 0 ? (
        <p className={styles.noCategories}>No categories created yet.</p>
      ) : (
        <ul className={styles.categoryList}>
          {renderCategoryTree(categories)}
        </ul>
      )}
    </div>
  );
}