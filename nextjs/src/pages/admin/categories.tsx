import { useState, useEffect } from "react";
import { client } from "../../lib/sanityClient";
import styles from "../../styles/admincat.module.css";

// Define TypeScript type for category
type Category = {
  _id: string;
  title: string;
  description?: string;
  parent?: { _id: string; title: string };
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [parent, setParent] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  // Fetch categories
  const fetchCategories = async () => {
    const data: Category[] = await client.fetch(
      `*[_type == "category"]{_id, title, description, parent->{_id, title}}`
    );
    setCategories(data);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Create or update category
  const handleSave = async () => {
    if (!title.trim()) return alert("Category name is required");

    const doc: Partial<Category> & { _type: string; parent?: any } = {
      _type: "category",
      title: title.trim(),
      description: description.trim(),
      parent: parent ? { _type: "reference", _ref: parent } : undefined,
    };

    if (editing) {
      await client.patch(editing).set(doc).commit();
      setEditing(null);
    } else {
      await client.create(doc);
    }

    setTitle("");
    setDescription("");
    setParent("");
    fetchCategories();
  };

  // Delete category
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    await client.delete(id);
    fetchCategories();
  };

  // Edit category
  const handleEdit = (category: Category) => {
    setEditing(category._id);
    setTitle(category.title);
    setDescription(category.description || "");
    setParent(category.parent?._id || "");
  };

  // Render nested categories
  const renderCategoryTree = (
    cats: Category[],
    parentId: string | null = null,
    level = 0
  ) =>
    cats
      .filter((c) => (c.parent?._id || null) === parentId)
      .map((c) => (
        <li
          key={c._id}
          className={styles.categoryItem}
          style={{ marginLeft: `${level * 20}px` }}
        >
          <span className={styles.categoryTitle}>{c.title}</span>
          <div className={styles.actionButtons}>
            <button onClick={() => handleEdit(c)}>Edit</button>
            <button
              className={styles.deleteButton}
              onClick={() => handleDelete(c._id)}
            >
              Delete
            </button>
          </div>
          <ul>{renderCategoryTree(cats, c._id, level + 1)}</ul>
        </li>
      ));

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>
        {editing ? "Edit Category" : "Create Category"}
      </h2>

      <input
        className={styles.input}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Category name"
      />

      <textarea
        className={styles.textarea}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        rows={3}
      />

      <select
        className={styles.select}
        value={parent}
        onChange={(e) => setParent(e.target.value)}
      >
        <option value="">No parent (top-level)</option>
        {categories.map((c) => (
          <option key={c._id} value={c._id}>
            {c.title}
          </option>
        ))}
      </select>

      <button className={styles.saveButton} onClick={handleSave}>
        {editing ? "Update" : "Create"}
      </button>

      <h3 className={styles.subHeading}>Existing Categories</h3>
      <ul className={styles.categoryList}>{renderCategoryTree(categories)}</ul>
    </div>
  );
}