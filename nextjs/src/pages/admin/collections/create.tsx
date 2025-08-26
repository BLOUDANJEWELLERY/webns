// src/admin/collections/create.tsx
import Head from "next/head";
import { useState, useMemo } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { createClient } from "next-sanity";
import styles from "../../../styles/adminEdit.module.css";
import AdminHeader from "../../components/AdminHeader";
import FilterSortModal from "../../components/filtersortmodal";

type Product = {
  _id: string;
  title: string;
  category?: string;          // optional category
  categories?: string[];      // optional multiple categories
  defaultImage?: { _id: string; url: string };
};

type Props = {
  products: Product[];
  categories?: string[];      // list of all categories for filter dropdown
};

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2023-08-01",
  useCdn: false,
});

export default function CreateCollectionPage({ products, categories = [] }: Props) {
  const router = useRouter();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [linkTarget, setLinkTarget] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Product selection / filter state
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(""); // "" = all
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);


  // Handle image selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  // Toggle product selection
  const toggleProductSelection = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!name.trim()) return alert("Name is required");

    setIsProcessing(true);

    let imageAsset: any = null;

    if (imageFile) {
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("type", "image");

      try {
        const res = await fetch("/api/products/uploadImage", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok || !data.assetId) throw new Error(data.error || "Upload failed");
        imageAsset = {
          _type: "image",
          asset: { _ref: data.assetId, _type: "reference" },
        };
      } catch (err) {
        console.error(err);
        alert("Image upload failed");
        setIsProcessing(false);
        return;
      }
    }

    const productsPayload = selectedProducts.map((id) => ({ _ref: id }));

    try {
      const res = await fetch("/api/collections/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          linkTarget,
          image: imageAsset,
          products: productsPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Collection creation failed");
      router.push("/admin/collections");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Collection creation failed");
      setIsProcessing(false);
    }
  };

  return (
<>

<Head>
        <title>Create Collections | Admin Panel</title>
        <meta name="description" content="Manage and create collections in your admin dashboard." />
      </Head>

  <AdminHeader title="Collections" titleHref="/admin/collections" />

  <div className={styles.mainContainer}>
    <h1 className={styles.heading}>Create New Collection</h1>

    <form
      className={styles.form}
      onSubmit={e => {
        e.preventDefault()
        handleSubmit()
      }}
    >
      {/* Collection Name */}
      <label className={styles.label}>Collection Name</label>
      <input
        type="text"
        placeholder="Collection Name"
        value={name}
        onChange={e => setName(e.target.value)}
        className={styles.input}
        required
      />

      {/* Description */}
      <label className={styles.label}>Description</label>
      <textarea
        placeholder="Description"
        rows={3}
        value={description}
        onChange={e => setDescription(e.target.value)}
        className={styles.textarea}
      />

      {/* Link Target */}
      <label className={styles.label}>Link Target</label>
      <input
        type="text"
        placeholder="e.g. /products?category=men"
        value={linkTarget}
        onChange={e => setLinkTarget(e.target.value)}
        className={styles.input}
      />

      {/* Image Upload */}
      <label className={styles.label}>Collection Image</label>
      <label className={styles.fileLabel}>
        Upload Image
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className={styles.hiddenFileInput}
        />
      </label>

      {/* Image Preview */}
      {imagePreview && (
        <div className={styles.previewWrapper}>
          <Image
            src={imagePreview}
            alt="Preview"
            width={150}
            height={150}
            className={styles.previewImage}
          />
        </div>
      )}

      {/* Product Selection */}
      <h3 className={styles.label}>Select Products</h3>

{/* Product Search */}
<input
  type="text"
  placeholder="Search products..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className={styles.input}
/>

{/* Product List */}
<div className={styles.productList}>
  {filteredProducts.length > 0 ? (
    filteredProducts.map((product) => (
      <label key={product._id} className={styles.productItem}>
        <input
          type="checkbox"
          checked={selectedProducts.includes(product._id)}
          onChange={() => toggleProductSelection(product._id)}
        />

        {product.defaultImage?.url ? (
          <Image
            src={product.defaultImage.url}
            alt={product.title}
            width={50}
            height={50}
            className={styles.productImage}
          />
        ) : (
          <div className={styles.productPlaceholder}>No Image</div>
        )}

        <span className={styles.productTitle}>{product.title}</span>
      </label>
    ))
  ) : (
    <p style={{ color: "#777", fontSize: "0.9rem" }}>No products found.</p>
  )}
</div>

      {/* Submit Button */}
      <button
        type="button"
        className={styles.button}
        disabled={isProcessing || !name.trim()}
      >
        {isProcessing ? "Creating..." : "Create Collection"}
      </button>
    </form>
  </div>
</>
  )
}

// Server-side fetch of products with default images
export async function getServerSideProps() {
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
    apiVersion: '2023-08-01',
    useCdn: false,
  })

  const products: Product[] = await client.fetch(`
    *[_type == "product"]{
      _id,
      title,
      "defaultImage": defaultImage.asset->{
        _id,
        url
      }
    } | order(title asc)
  `)

  return { props: { products } }
}