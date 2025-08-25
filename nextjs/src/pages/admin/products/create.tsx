// src/pages/admin/products/create.tsx
import { useState, useEffect, useMemo} from 'react'
import { useRouter } from 'next/router'
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import Image from 'next/image'
import styles from '../../../styles/adminEdit.module.css'
import { v4 as uuidv4 } from 'uuid'
import React from "react"
import AdminHeader from '../../components/AdminHeader'


const client = createClient({
  projectId: '3jc8hsku',
  dataset: 'production',
  apiVersion: '2023-07-30',
  useCdn: false,
})

const builder = imageUrlBuilder(client)
const urlFor = (source: any) => builder.image(source).width(300).url()

interface Variant {
  size: string
  quantity: number
  priceOverride?: number
  sku?: string
  color: string
  _key?: string
  showPriceOverride?: boolean
}

interface ColorOption {
  color: string
  imageFile: File | null
  imagePreview: string | null
  existingImageId?: string
  variants: Variant[]
  _key?: string
}

// Define the raw category type fetched from Sanity
interface CategoryRaw {
  _id: string
  title: string
  parent?: { _id: string; title: string }
  order?: number
}

// Define the tree node structure (optional, if you want nested categories)
interface CategoryNode {
  _id: string
  title: string
  parent?: { _id: string; title: string }
  order?: number
  children: CategoryNode[]
}

export async function getServerSideProps() {
  const categories: CategoryRaw[] = await client.fetch(`
    *[_type=="category"]{
      _id,
      title,
      parent->{_id, title},
      order
    } | order(order asc)
  `)

  return {
    props: { categories: categories || [] },
  }
}

// No need for product prop
export default function AdminCreatePage({ categories }: { categories: CategoryRaw[] }) {

  const router = useRouter()
  const [loading, setLoading] = useState(false)

// Build the category tree from flat array
const buildCategoryTree = (cats: CategoryRaw[] = []): CategoryNode[] => {
  const map: Record<string, CategoryNode> = {};
  const roots: CategoryNode[] = [];

  cats.forEach(cat => {
    map[cat._id] = { ...cat, children: [] };
  });

  cats.forEach(cat => {
    if (cat.parent?._id) {
      map[cat.parent._id].children.push(map[cat._id]);
    } else {
      roots.push(map[cat._id]);
    }
  });

  // Sort children recursively by order
  const sortTree = (nodes: CategoryNode[]) => {
    nodes.sort((a, b) => (a.order || 0) - (b.order || 0));
    nodes.forEach(n => sortTree(n.children));
  };

  sortTree(roots);

  return roots;
};

// Usage: build tree from fetched categories
const categoryTree = useMemo(() => buildCategoryTree(categories || []), [categories]);

// Toggle selection of category
// Selected categories state
const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

// Toggle a category on or off
const handleCategoryToggle = (id: string) => {
  setSelectedCategories(prev =>
    prev.includes(id)
      ? prev.filter(catId => catId !== id) // remove if already selected
      : [...prev, id] // add if not selected
  );
};

// Recursive JSX render function
const renderCategoryTree = (nodes: CategoryNode[]): React.ReactElement[] => {
  return nodes.map(node => (
    <CategoryNodeItem
      key={node._id}
      node={node}
      selectedCategories={selectedCategories}
      handleCategoryToggle={handleCategoryToggle}
    />
  ));
};

type CategoryNodeItemProps = {
  node: CategoryNode;
  selectedCategories: string[];
  handleCategoryToggle: (id: string) => void;
};

const CategoryNodeItem: React.FC<CategoryNodeItemProps> = ({
  node,
  selectedCategories,
  handleCategoryToggle,
}) => {
  const [expanded, setExpanded] = useState(false); // collapsed by default

  return (
    <div>
      <div className={styles.categoryRow}>
        {node.children.length > 0 && (
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={() => setExpanded(prev => !prev)}
          >
            {expanded ? "▾" : "▸"}
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

      {expanded && node.children.length > 0 && (
        <div className={styles.nested}>
          {node.children.map(child => (
            <CategoryNodeItem
              key={child._id}
              node={child}
              selectedCategories={selectedCategories}
              handleCategoryToggle={handleCategoryToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

  const [openColors, setOpenColors] = useState<boolean[]>(colors.map(() => true))

  // Modal controls
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [modalMessage, setModalMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
// For color & variant removal
const [showRemoveColorModal, setShowRemoveColorModal] = useState(false)
const [showRemoveVariantModal, setShowRemoveVariantModal] = useState(false)
const [pendingRemoveColorIndex, setPendingRemoveColorIndex] = useState<number | null>(null)
const [pendingRemoveVariant, setPendingRemoveVariant] = useState<{ ci: number, vi: number } | null>(null)


  // Handlers
  const handleDefaultImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setDefaultImageFile(file)
  }

  const addColor = () => {
    setColors([
      ...colors,
      {
        color: '',
        imageFile: null,
        imagePreview: null,
        variants: [],
        _key: Math.random().toString(36).substr(2, 9),
      },
    ])
    setOpenColors([...openColors, true])
  }

  const removeColor = (i: number) => {
    setColors(colors.filter((_, idx) => idx !== i))
    setOpenColors(openColors.filter((_, idx) => idx !== i))
  }

  const handleColorImageChange = (index: number, file: File) => {
    const updated = [...colors]
    updated[index].imageFile = file
    updated[index].imagePreview = URL.createObjectURL(file)
    setColors(updated)
  }

  const addVariant = (colorIndex: number) => {
    const updated = [...colors]
    updated[colorIndex].variants.push({
      size: '',
      quantity: 1,
      color: colors[colorIndex].color,
      _key: Math.random().toString(36).substr(2, 9),
      showPriceOverride: false,
    })
    setColors(updated)
  }

  const removeVariant = (colorIndex: number, variantIndex: number) => {
    const updated = [...colors]
    updated[colorIndex].variants.splice(variantIndex, 1)
    setColors(updated)
  }

// --- Update Handler ---
const handleSubmit = async () => {
  setIsProcessing(true);   // show processing in modal
  setLoading(true);

  try {
    let defaultAssetId = defaultImageId;

    // Upload default image if chosen
    if (defaultImageFile) {
      const formData = new FormData();
      formData.append('file', defaultImageFile);
      formData.append('type', 'image');
      const res = await fetch('/api/products/uploadImage', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      defaultAssetId = data.assetId;
    }

    // Upload color images
    const colorImages: any[] = [];
    for (const color of colors) {
      let assetId = color.existingImageId;
      if (color.imageFile) {
        const formData = new FormData();
        formData.append('file', color.imageFile);
        formData.append('type', 'image');
        const res = await fetch('/api/products/uploadImage', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        assetId = data.assetId;
      }
      colorImages.push({
        _key: color._key,
        color: color.color,
        image: assetId ? { _type: 'image', asset: { _type: 'reference', _ref: assetId } } : undefined,
      });
    }

    // Build variants array
    const variants: any[] = [];
    colors.forEach(c =>
      c.variants.forEach(v =>
        variants.push({
          _key: v._key,
          size: v.size,
          quantity: Number(v.quantity),
          color: c.color,
          priceOverride: v.priceOverride ? Number(v.priceOverride) : undefined,
          sku: v.sku || `${c.color}-${v.size}-${Math.floor(Math.random() * 1000000)}`,
        })
      )
    );

    // Create product API call
    const res = await fetch('/api/products/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        price: Number(price),
        description,
        defaultImage: defaultAssetId
          ? { _type: 'image', asset: { _type: 'reference', _ref: defaultAssetId } }
          : undefined,
        colorImages,
        variants,
        categories: selectedCategories.map(id => ({
          _key: uuidv4(),
          _type: 'reference',
          _ref: id,
        })),
      }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to create product');

    setModalMessage('Product created successfully.');
    setTimeout(() => router.push('/admin'), 500); // redirect to dashboard
  } catch (err: any) {
    setModalMessage(err.message);
    setIsProcessing(false);
  } finally {
    setLoading(false);
  }
};

  return (
<>
 <AdminHeader title="Products" titleHref="/admin/products" />

    <div className={styles.mainContainer}>
  <h1 className={styles.heading}>Create Product</h1>

  <form className={styles.form} onSubmit={handleSubmit}>
    {/* Title */}
    <div className={styles.formGroup}>
      <label className={styles.label}>Title</label>
      <input
        className={styles.input}
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
      />
    </div>

    {/* Price */}
    <div className={styles.formGroup}>
      <label className={styles.label}>Price</label>
      <input
        type="number"
        step="0.01"
        className={styles.input}
        value={price}
        onChange={e => setPrice(e.target.value)}
        required
      />
    </div>

    {/* Default Image */}
    <div className={styles.formGroup}>
  <label className={styles.label}>Default Image</label>

  {/* Custom File Upload Button */}
  <label className={styles.fileLabel}>
    Upload Default Image
    <input
      type="file"
      accept="image/*"
      onChange={handleDefaultImageChange}
      className={styles.hiddenFileInput}
    />
  </label>

  {/* Preview */}
  {defaultImagePreview && (
    <div className={styles.previewWrapper}>
      <Image
        src={defaultImagePreview}
        alt="Default"
        width={150}
        height={150}
        className={styles.previewImage}
      />
    </div>
  )}
</div>

     <label className={styles.label}>Categories</label>
<div className={styles.checkboxGroup}>
  {renderCategoryTree(categoryTree, selectedCategories, handleCategoryToggle)}
</div>


{/* Description */}
<div className={styles.formGroup}>
  <label className={styles.label}>Description</label>
  <textarea
    className={styles.textarea}
    value={description}
    onChange={e => setDescription(e.target.value)}
    rows={4}
    placeholder="Enter product description..."
  />
</div>

{/* Colors & Variants */}
<h3 className={styles.subHeading}>Colors & Variants</h3>
{colors.map((color, ci) => (
  <div key={color._key} className={styles.colorBlock}>
    {/* Collapsible Header */}
    <div
      className={styles.colorHeader}
      onClick={() => {
        const updated = [...openColors];
        updated[ci] = !updated[ci];
        setOpenColors(updated);
      }}
    >
      <span>{color.color || 'Unnamed Color'}</span>
      <span>{openColors[ci] ? '▲' : '▼'}</span>
    </div>

    {/* Render color inputs only if open */}
  {openColors[ci] && (
  <>
    {/* All inputs, variants, buttons… */}
  
        {/* Color Name */}
<label className={styles.label}>Color Name</label>
        <input
          className={styles.input}
          value={color.color}
          onChange={e => {
            const updated = [...colors];
            updated[ci].color = e.target.value;
            setColors(updated);
          }}
          required
        />

        {/* Color Image */}
        <label className={styles.label}>Color Image</label>
        <label className={styles.fileLabel}>
          Upload Color Image
          <input
            type="file"
            accept="image/*"
            onChange={e =>
              e.target.files && handleColorImageChange(ci, e.target.files[0])
            }
            className={styles.hiddenFileInput}
          />
        </label>

        {/* Preview */}
        {color.imagePreview && (
          <div className={styles.previewWrapper}>
            <Image
              src={color.imagePreview}
              alt="Color"
              width={120}
              height={120}
              className={styles.previewImage}
            />
          </div>
        )}

        {/* Variants */}
        <h4 className={styles.variantHeading}>Variants</h4>
        {color.variants.map((v, vi) => (
          <div key={v._key} className={styles.variantCard}>
            {/* Size Selector */}
            <select
              value={v.size}
              onChange={e => {
                const updated = [...colors];
                updated[ci].variants[vi].size = e.target.value;
                setColors(updated);
              }}
              required
              className={styles.select}
            >
              <option value="">Size</option>
              {SIZE_OPTIONS.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Quantity */}
            <input
              type="number"
              placeholder="Qty"
              min={1}
              value={v.quantity}
              onChange={e => {
                const updated = [...colors];
                updated[ci].variants[vi].quantity = Number(e.target.value);
                setColors(updated);
              }}
              className={styles.inputSmall}
              required
            />

            {/* Price Override */}
            <div className={styles.priceOverrideWrapper}>
              {v.showPriceOverride && (
                <input
                  type="number"
                  placeholder="Price Override"
                  className={styles.priceOverrideInput}
                  value={v.priceOverride || ''}
                  onChange={e => {
                    const updated = [...colors];
                    updated[ci].variants[vi].priceOverride = Number(e.target.value);
                    setColors(updated);
                  }}
                />
              )}
              <button
                type="button"
                className={styles.priceToggleButton}
                onClick={() => {
                  const updated = [...colors];
                  updated[ci].variants[vi].showPriceOverride = !v.showPriceOverride;
                  setColors(updated);
                }}
              >
                {v.showPriceOverride ? 'Hide' : 'Price'}
              </button>
            </div>

            {/* Remove Variant */}
            <button
  type="button"
  className={styles.removeButton}
  onClick={() => {
    setPendingRemoveVariant({ ci, vi })
    setShowRemoveVariantModal(true)
  }}
>
  Remove
</button>
          </div>
        ))}

        {/* Add Variant / Remove Color */}
        <div className={styles.variantActions}>
          <button
            type="button"
            className={styles.button}
            onClick={() => addVariant(ci)}
          >
            Add Variant
          </button>
          <button
              type="button"
                className={styles.deleteButton}
                onClick={() => {
                  setPendingRemoveColorIndex(ci)
                  setShowRemoveColorModal(true)
                    }}
                  >
                  Remove Color
              </button>
        </div>
      </>
)}
  </div>
))}

    {/* Add Color */}
    <button type="button" className={styles.button} onClick={addColor}>
      Add Color
    </button>

    {/* Actions */}
<div className={styles.actionWrapper}>
  <button
    type="button"
    disabled={loading || !isProductChanged}
    className={`${styles.button} ${!isProductChanged ? styles.disabledButton : ''}`}
    onClick={() => setShowUpdateModal(true)}
  >
    {loading ? "Creating..." : "Create Product"}
  </button>

</div>
  </form>
</div>

{/* Update Confirmation Modal */}
{showUpdateModal && (
  <div className={styles.modalOverlay}>
    <div className={styles.modal}>
      {isProcessing ? (
        <>
          <h2>Creating...</h2>
          <div className={styles.spinner}></div>
        </>
      ) : (
        <>
          <h2>Confirm Update</h2>
          <p>Are you sure you want to create this product?</p>
          <div className={styles.modalButtons}>
            <button className={styles.cancelBtn} onClick={() => setShowUpdateModal(false)}>Cancel</button>
            <button className={styles.confirmBtn} onClick={() => handleSubmit()}>Update</button>
          </div>
        </>
      )}
    </div>
  </div>
)}

{/* Remove Color Confirmation Modal */}
{showRemoveColorModal && (
  <div className={styles.modalOverlay}>
    <div className={styles.modal}>
      <h2>Confirm Remove Color</h2>
      <p>Are you sure you want to remove this color and all its variants?</p>
      <div className={styles.modalButtons}>
        <button
          className={styles.cancelBtn}
          onClick={() => {
            setShowRemoveColorModal(false)
            setPendingRemoveColorIndex(null)
          }}
        >
          Cancel
        </button>
        <button
          className={styles.dangerBtn}
          onClick={() => {
            if (pendingRemoveColorIndex !== null) {
              removeColor(pendingRemoveColorIndex)
            }
            setShowRemoveColorModal(false)
            setPendingRemoveColorIndex(null)
          }}
        >
          Remove
        </button>
      </div>
    </div>
  </div>
)}

{/* Remove Variant Confirmation Modal */}
{showRemoveVariantModal && (
  <div className={styles.modalOverlay}>
    <div className={styles.modal}>
      <h2>Confirm Remove Variant</h2>
      <p>Are you sure you want to remove this variant?</p>
      <div className={styles.modalButtons}>
        <button
          className={styles.cancelBtn}
          onClick={() => {
            setShowRemoveVariantModal(false)
            setPendingRemoveVariant(null)
          }}
        >
          Cancel
        </button>
        <button
          className={styles.dangerBtn}
          onClick={() => {
            if (pendingRemoveVariant) {
              removeVariant(pendingRemoveVariant.ci, pendingRemoveVariant.vi)
            }
            setShowRemoveVariantModal(false)
            setPendingRemoveVariant(null)
          }}
        >
          Remove
        </button>
      </div>
    </div>
  </div>
)}
</>
  )
}