import { useState, useEffect } from "react";
import { client } from "@/lib/sanity"; // Your Sanity client
import styles from "@/styles/Admin.module.css"; // Optional styling

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState("");
  const [parent, setParent] = useState("");
  const [editing, setEditing] = useState(null); // _id of category being edited
  const [description, setDescription] = useState("");

  // Fetch categories from Sanity
  const fetchCategories = async () => {
    const data = await client.fetch(
      `*[_type == "category"]{_id, title, description, parent->{_id, title}}`
    );
    setCategories(data);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Create or Update Category
  const handleSave = async () => {
    if (!title.trim()) return alert("Category name is required");

    const doc = {
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

  // Delete Category
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    await client.delete(id);
    fetchCategories();
  };

  // Edit Category
  const handleEdit = (category) => {
    setEditing(category._id);
    setTitle(category.title);
    setDescription(category.description || "");
    setParent(category.parent?._id || "");
  };

  // Utility: Build hierarchy display
  const renderCategoryTree = (cats, parentId = null, level = 0) =>
    cats
      .filter(c => (c.parent?._id || null) === parentId)
      .map(c => (
        <li key={c._id} style={{ marginLeft: `${level * 20}px` }}>
          {c.title}
          <button onClick={() => handleEdit(c)} style={{ marginLeft: 10 }}>Edit</button>
          <button onClick={() => handleDelete(c._id)} style={{ marginLeft: 5 }}>Delete</button>
          <ul>{renderCategoryTree(cats, c._id, level + 1)}</ul>
        </li>
      ));

  return (
    <div style={{ padding: "20px" }}>
      <h2>{editing ? "Edit Category" : "Create Category"}</h2>

      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Category name"
      />
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Description"
        rows={3}
        style={{ display: "block", marginTop: 10 }}
      />

      <select value={parent} onChange={e => setParent(e.target.value)} style={{ marginTop: 10 }}>
        <option value="">No parent (top-level)</option>
        {categories.map(c => (
          <option key={c._id} value={c._id}>{c.title}</option>
        ))}
      </select>

      <button onClick={handleSave} style={{ display: "block", marginTop: 10 }}>
        {editing ? "Update" : "Create"}
      </button>

      <h3 style={{ marginTop: 30 }}>Existing Categories</h3>
      <ul>
        {renderCategoryTree(categories)}
      </ul>
    </div>
  );
}