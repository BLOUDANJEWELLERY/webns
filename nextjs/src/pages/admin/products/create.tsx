// src/pages/admin/products/create.tsx
import { useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import { createClient } from 'next-sanity'
import Image from 'next/image'
import styles from '../../../styles/adminEdit.module.css'
import { v4 as uuidv4 } from 'uuid'
import AdminHeader from '../../components/AdminHeader'

const client = createClient({
  projectId: '3jc8hsku',
  dataset: 'production',
  apiVersion: '2023-07-30',
  useCdn: false,
})

interface Variant {
  size: string
  quantity: number
  priceOverride?: number
  sku: string
  color: string
  _key: string
  showPriceOverride?: boolean
}

interface ColorOption {
  color: string
  imageFile: File | null
  imagePreview: string | null
  variants: Variant[]
  _key: string
}

// Raw category type from Sanity
interface CategoryRaw {
  _id: string
  title: string
  parent?: { _id: string; title: string }
  order?: number
}

// Category tree node
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
  return { props: { categories: categories || [] } }
}
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export default function AdminCreatePage({ categories }: { categories: CategoryRaw[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Product fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState<number | ''>('')
  const [defaultImageFile, setDefaultImageFile] = useState<File | null>(null)
  const [defaultImagePreview, setDefaultImagePreview] = useState<string | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [colors, setColors] = useState<ColorOption[]>([])
  // At the top of your AdminCreatePage component:
const [openColors, setOpenColors] = useState<boolean[]>([]);

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




  // ----------- Category tree logic ----------
  const buildCategoryTree = (cats: CategoryRaw[] = []): CategoryNode[] => {
    const map: Record<string, CategoryNode> = {}
    const roots: CategoryNode[] = []

    cats.forEach(cat => { map[cat._id] = { ...cat, children: [] } })
    cats.forEach(cat => {
      if (cat.parent?._id) map[cat.parent._id].children.push(map[cat._id])
      else roots.push(map[cat._id])
    })

    const sortTree = (nodes: CategoryNode[]) => {
      nodes.sort((a, b) => (a.order || 0) - (b.order || 0))
      nodes.forEach(n => sortTree(n.children))
    }
    sortTree(roots)
    return roots
  }

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories])
  const handleCategoryToggle = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const renderCategoryTree = (nodes: CategoryNode[]): React.ReactElement[] => {
    return nodes.map(node => (
      <CategoryNodeItem
        key={node._id}
        node={node}
        selectedCategories={selectedCategories}
        handleCategoryToggle={handleCategoryToggle}
      />
    ))
  }

  const CategoryNodeItem: React.FC<{
    node: CategoryNode
    selectedCategories: string[]
    handleCategoryToggle: (id: string) => void
  }> = ({ node, selectedCategories, handleCategoryToggle }) => {
    const [expanded, setExpanded] = useState(false)
    return (
      <div>
        <div className={styles.categoryRow}>
          {node.children.length > 0 && (
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => setExpanded(prev => !prev)}
            >
              {expanded ? '▾' : '▸'}
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
    )
  }

// ----------- Colors & Variants logic ----------
const addColor = () => {
  const newColor = {
    color: '',
    imageFile: null,
    imagePreview: null,
    variants: [],
    _key: uuidv4(),
  };

  // Add the new color to colors array
  setColors(prevColors => [...prevColors, newColor]);

  // Automatically expand the new color block in the UI
  setOpenColors(prevOpen => [...prevOpen, true]);
};

const removeColor = (index: number) => {
  // Remove the color from colors array
  setColors(prevColors => prevColors.filter((_, i) => i !== index));

  // Also remove the corresponding open/close state
  setOpenColors(prevOpen => prevOpen.filter((_, i) => i !== index));
};

  const handleColorImageChange = (index: number, file: File) => {
    setColors(prev => {
      const updated = [...prev]
      updated[index].imageFile = file
      updated[index].imagePreview = URL.createObjectURL(file)
      return updated
    })
  }

  const addVariant = (colorIndex: number) => {
    setColors(prev => {
      const updated = [...prev]
      const color = updated[colorIndex]
      color.variants.push({
        size: '',
        quantity: 1,
        color: color.color,
        priceOverride: undefined,
        sku: `${color.color}-NEW-${Math.floor(Math.random() * 1000000)}`,
        _key: uuidv4(),
        showPriceOverride: false,
      })
      return updated
    })
  }

  const removeVariant = (colorIndex: number, variantIndex: number) => {
    setColors(prev => {
      const updated = [...prev]
      updated[colorIndex].variants.splice(variantIndex, 1)
      return updated
    })
  }

  // ----------- Default Image change ----------
  const handleDefaultImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setDefaultImageFile(file)
    if (file) setDefaultImagePreview(URL.createObjectURL(file))
  }

  // ----------- Create Handler ----------
  const handleSubmit = async () => {
    setIsProcessing(true)
    setLoading(true)
    try {
      // Start with undefined for new product
      let defaultAssetId: string | undefined = undefined

      // Upload default image if chosen
      if (defaultImageFile) {
        const formData = new FormData()
        formData.append('file', defaultImageFile)
        formData.append('type', 'image')
        const res = await fetch('/api/products/uploadImage', { method: 'POST', body: formData })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        defaultAssetId = data.assetId
      }

      // Upload color images
      const colorImages: any[] = []
      for (const color of colors) {
        let assetId: string | undefined = undefined
        if (color.imageFile) {
          const formData = new FormData()
          formData.append('file', color.imageFile)
          formData.append('type', 'image')
          const res = await fetch('/api/products/uploadImage', { method: 'POST', body: formData })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)
          assetId = data.assetId
        }
        colorImages.push({
          _key: color._key,
          color: color.color,
          image: assetId ? { _type: 'image', asset: { _type: 'reference', _ref: assetId } } : undefined,
        })
      }

      // Build variants array
      const variants: any[] = []
      colors.forEach(c =>
        c.variants.forEach(v =>
          variants.push({
            _key: v._key,
            size: v.size,
            quantity: Number(v.quantity),
            color: c.color,
            priceOverride: v.priceOverride ? Number(v.priceOverride) : undefined,
            sku: v.sku,
          })
        )
      )

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
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to create product')

      setModalMessage('Product created successfully.')
      setTimeout(() => router.push('/admin'), 500)
    } catch (err: any) {
      setModalMessage(err.message)
      setIsProcessing(false)
    } finally {
      setLoading(false)
    }
  }

  return (
<>
 <AdminHeader title="Products" titleHref="/admin/products" />

 <div className={styles.mainContainer}>
  <h1 className={styles.heading}>Create Product</h1>

  <form
    className={styles.form}
    onSubmit={e => {
      e.preventDefault()
      handleSubmit()
    }}
  >
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
        onChange={e => {
          const val = e.target.value
          setPrice(val === '' ? '' : Number(val))
        }}
        required
      />
    </div>

    {/* Default Image */}
    <div className={styles.formGroup}>
      <label className={styles.label}>Default Image</label>

      <label className={styles.fileLabel}>
        Upload Default Image
        <input
          type="file"
          accept="image/*"
          onChange={handleDefaultImageChange}
          className={styles.hiddenFileInput}
        />
      </label>

      {defaultImagePreview && (
        <div className={styles.previewWrapper}>
          <Image
            src={defaultImagePreview}
            alt="Default Image"
            width={150}
            height={150}
            className={styles.previewImage}
          />
        </div>
      )}
    </div>

    {/* Categories */}
    <div className={styles.formGroup}>
      <label className={styles.label}>Categories</label>
      <div className={styles.checkboxGroup}>
        {renderCategoryTree(categoryTree)}
      </div>
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
            const updated = [...openColors]
            updated[ci] = !updated[ci]
            setOpenColors(updated)
          }}
        >
          <span>{color.color || 'Unnamed Color'}</span>
          <span>{openColors[ci] ? '▲' : '▼'}</span>
        </div>

        {openColors[ci] && (
          <>
            {/* Color Name */}
            <label className={styles.label}>Color Name</label>
            <input
              className={styles.input}
              value={color.color}
              onChange={e => {
                const updated = [...colors]
                updated[ci].color = e.target.value
                setColors(updated)
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
                    const updated = [...colors]
                    updated[ci].variants[vi].size = e.target.value
                    setColors(updated)
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
                    const updated = [...colors]
                    updated[ci].variants[vi].quantity = Number(e.target.value)
                    setColors(updated)
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
                        const updated = [...colors]
                        updated[ci].variants[vi].priceOverride = Number(e.target.value)
                        setColors(updated)
                      }}
                    />
                  )}
                  <button
                    type="button"
                    className={styles.priceToggleButton}
                    onClick={() => {
                      const updated = [...colors]
                      updated[ci].variants[vi].showPriceOverride = !v.showPriceOverride
                      setColors(updated)
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
              <button type="button" className={styles.button} onClick={() => addVariant(ci)}>
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

    {/* Submit */}
    <div className={styles.actionWrapper}>
  <button
  type="submit"
  disabled={loading}
  className={styles.button}
>
  {loading ? 'Creating...' : 'Create Product'}
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