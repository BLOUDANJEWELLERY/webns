// src/pages/admin/[slug].tsx
import { useState, useEffect, useMemo} from 'react'
import { useRouter } from 'next/router'
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import Image from 'next/image'
import styles from '../../styles/adminEdit.module.css'

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

interface Product {
  _id: string
  title: string
  price: number
  description: string
  defaultImage?: any
  variants?: Variant[]
  colorImages?: any[]
  slug: string
}

export async function getStaticPaths() {
  const slugs: string[] = await client.fetch(
    `*[_type=="product" && defined(slug.current)].slug.current`
  )
  return {
    paths: slugs.map(slug => ({ params: { slug } })),
    fallback: true,
  }
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const query = `*[_type=="product" && slug.current==$slug][0]{
    _id,
    title,
    price,
    description,
    defaultImage,
    variants,
    colorImages,
    "slug": slug.current
  }`
  const product: Product | null = await client.fetch(query, { slug: params.slug })
  if (!product) return { notFound: true }
  return { props: { product }, revalidate: 60 }
}

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export default function AdminEditPage({ product }: { product: Product | null }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Core product states
  const [title, setTitle] = useState(product?.title || '')
  const [price, setPrice] = useState(product?.price.toString() || '')
  const [description, setDescription] = useState(product?.description || "")
  const [defaultImageFile, setDefaultImageFile] = useState<File | null>(null)
  const [defaultImagePreview, setDefaultImagePreview] = useState(
    product?.defaultImage ? urlFor(product.defaultImage) : null
  )
  const [defaultImageId] = useState(product?.defaultImage?.asset?._ref)

  // Colors & Variants
  const [colors, setColors] = useState<ColorOption[]>(() => {
    const colorMap: Record<string, ColorOption> = {}
    product?.variants?.forEach(v => {
      if (!colorMap[v.color]) {
        colorMap[v.color] = {
          color: v.color,
          imageFile: null,
          imagePreview: null,
          existingImageId: undefined,
          variants: [],
          _key: v._key || Math.random().toString(36).substr(2, 9),
        }
      }
      colorMap[v.color].variants.push({
        ...v,
        _key: v._key || Math.random().toString(36).substr(2, 9),
        showPriceOverride: !!(v.priceOverride && v.priceOverride > 0),
      })
    })

    const colorImages: ColorOption[] =
      product?.colorImages?.map(ci => ({
        color: ci.color,
        imageFile: null,
        imagePreview: ci.image ? urlFor(ci.image) : null,
        existingImageId: ci.image?.asset?._ref,
        variants: colorMap[ci.color]?.variants || [],
        _key: ci._key || Math.random().toString(36).substr(2, 9),
      })) || Object.values(colorMap)

    return colorImages
  })

  const [openColors, setOpenColors] = useState<boolean[]>(colors.map(() => true))

  // Modal controls
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [modalMessage, setModalMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
// For color & variant removal
const [showRemoveColorModal, setShowRemoveColorModal] = useState(false)
const [showRemoveVariantModal, setShowRemoveVariantModal] = useState(false)
const [pendingRemoveColorIndex, setPendingRemoveColorIndex] = useState<number | null>(null)
const [pendingRemoveVariant, setPendingRemoveVariant] = useState<{ ci: number, vi: number } | null>(null)

// Detect changes
const isProductChanged = useMemo(() => {
  if (!product) return false
  if (title !== product.title) return true
  if (description !== (product.description || '')) return true // ✅ check description
  if (Number(price) !== product.price) return true
  if (defaultImageFile) return true
  if (colors.length !== (product.colorImages?.length || 0)) return true

  for (let i = 0; i < colors.length; i++) {
    const color = colors[i]
    const origColor = product.colorImages?.[i]

    if (color.color !== origColor?.color) return true
    if (color.imageFile) return true

    const origVariants = product.variants?.filter(v => v.color === color.color) || []
    if (color.variants.length !== origVariants.length) return true

    for (let j = 0; j < color.variants.length; j++) {
      const v = color.variants[j]
      const ov = origVariants[j]
      if (!ov) return true
      if (v.size !== ov.size) return true
      if (v.quantity !== ov.quantity) return true
      if ((v.priceOverride || 0) !== (ov.priceOverride || 0)) return true
    }
  }
  return false
}, [title, description, price, defaultImageFile, colors, product])

  // Default image preview
  useEffect(() => {
    if (!defaultImageFile) return
    const url = URL.createObjectURL(defaultImageFile)
    setDefaultImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [defaultImageFile])

  if (router.isFallback) return <p>Loading product...</p>
  if (!product) return <p>Product not found</p>

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
  if (!product?._id) {
    setModalMessage('Missing product ID');
    setShowUpdateModal(true);
    return;
  }

  setIsProcessing(true);   // show processing in modal
  setLoading(true);

  try {
    let defaultAssetId = defaultImageId;

    // Upload default image if changed
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

    // Update product API call
    const res = await fetch('/api/products/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: product._id,
        title,
        price: Number(price),
        description,
        defaultImage: defaultAssetId
          ? { _type: 'image', asset: { _type: 'reference', _ref: defaultAssetId } }
          : undefined,
        colorImages,
        variants,
      }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update product');

    setModalMessage('Product updated successfully.');
    // Keep modal open showing processing
    setTimeout(() => router.push('/admin'), 500); // slight delay before redirect
  } catch (err: any) {
    setModalMessage(err.message);
    setIsProcessing(false); // show modal with buttons again
  } finally {
    setLoading(false);
  }
};

// --- Delete Handler ---
const handleDelete = async () => {
  if (!product?._id) {
    setModalMessage('Missing product ID');
    setShowDeleteModal(true);
    return;
  }

  setIsProcessing(true); // show processing in modal
  setLoading(true);

  try {
    const res = await fetch('/api/products/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: product._id }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to delete product');

    setModalMessage('Product deleted successfully.');
    setTimeout(() => router.push('/admin'), 500); // redirect after brief delay
  } catch (err: any) {
    setModalMessage(err.message);
    setIsProcessing(false); // show modal with buttons again
  } finally {
    setLoading(false);
  }
};

  return (
<>
    <div className={styles.mainContainer}>
  <h1 className={styles.heading}>Edit Product</h1>

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
    Change Default Image
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
          Change Color Image
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
    {loading ? "Updating..." : "Update Product"}
  </button>

  <button
    type="button"
    disabled={loading}
    onClick={() => setShowDeleteModal(true)}
    className={styles.deleteButton}
  >
    {loading ? "Processing..." : "Delete Product"}
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
          <h2>Updating...</h2>
          <div className={styles.spinner}></div>
        </>
      ) : (
        <>
          <h2>Confirm Update</h2>
          <p>Are you sure you want to update this product?</p>
          <div className={styles.modalButtons}>
            <button className={styles.cancelBtn} onClick={() => setShowUpdateModal(false)}>Cancel</button>
            <button className={styles.confirmBtn} onClick={() => handleSubmit()}>Update</button>
          </div>
        </>
      )}
    </div>
  </div>
)}

{/* Delete Confirmation Modal */}
{showDeleteModal && (
  <div className={styles.modalOverlay}>
    <div className={styles.modal}>
      {isProcessing ? (
        <>
          <h2>Deleting...</h2>
          <div className={styles.spinner}></div>
        </>
      ) : (
        <>
          <h2>Confirm Deletion</h2>
          <p>This action cannot be undone. Are you sure you want to delete this product?</p>
          <div className={styles.modalButtons}>
            <button className={styles.cancelBtn} onClick={() => setShowDeleteModal(false)}>Cancel</button>
            <button className={styles.dangerBtn} onClick={() => handleDelete()}>Delete</button>
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
