// src/pages/admin/create.tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import styles from '../../styles/admincreate.module.css'

interface Variant {
  size: string
  quantity: number
  priceOverride?: number
}

interface ColorOption {
  color: string
  imageFile: File | null
  imagePreview: string | null
  variants: Variant[]
}

export default function CreateProduct() {
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [defaultImageFile, setDefaultImageFile] = useState<File | null>(null)
  const [defaultImagePreview, setDefaultImagePreview] = useState<string | null>(null)
  const [colors, setColors] = useState<ColorOption[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Preview for default image
  useEffect(() => {
    if (!defaultImageFile) {
      setDefaultImagePreview(null)
      return
    }
    const url = URL.createObjectURL(defaultImageFile)
    setDefaultImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [defaultImageFile])

  // Add a new color option
  const addColor = () => {
    setColors([
      ...colors,
      { color: '', imageFile: null, imagePreview: null, variants: [] },
    ])
  }

  // Remove a color
  const removeColor = (index: number) => {
    const newColors = [...colors]
    newColors.splice(index, 1)
    setColors(newColors)
  }

  // Add a variant to a color
  const addVariant = (colorIndex: number) => {
    const newColors = [...colors]
    newColors[colorIndex].variants.push({ size: '', quantity: 0 })
    setColors(newColors)
  }

  // Remove a variant
  const removeVariant = (colorIndex: number, variantIndex: number) => {
    const newColors = [...colors]
    newColors[colorIndex].variants.splice(variantIndex, 1)
    setColors(newColors)
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Upload default image
      let defaultImageAssetId: string | null = null
      if (defaultImageFile) {
        const formData = new FormData()
        formData.append('file', defaultImageFile)
        formData.append('type', 'image')
        const res = await fetch('/api/products/uploadImage', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        defaultImageAssetId = data.assetId
      }

      // Upload color images
      const colorImages: any[] = []
      for (const color of colors) {
        let imageId = null
        if (color.imageFile) {
          const formData = new FormData()
          formData.append('file', color.imageFile)
          formData.append('type', 'image')
          const res = await fetch('/api/products/uploadImage', {
            method: 'POST',
            body: formData,
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)
          imageId = data.assetId
        }
        colorImages.push({
          color: color.color,
          image: imageId ? { _type: 'image', asset: { _type: 'reference', _ref: imageId } } : null,
        })
      }

      // Build variants
      const variants: any[] = []
      for (const color of colors) {
        for (const v of color.variants) {
          variants.push({
            color: color.color,
            size: v.size,
            quantity: Number(v.quantity),
            priceOverride: v.priceOverride ? Number(v.priceOverride) : undefined,
            sku: `${color.color}-${v.size}-${Math.floor(Math.random() * 1000000)}`,
          })
        }
      }

      // Send to API
      const res = await fetch('/api/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          price: Number(price),
          defaultImage: defaultImageAssetId
            ? { _type: 'image', asset: { _type: 'reference', _ref: defaultImageAssetId } }
            : undefined,
          colorImages,
          variants,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push('/admin')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.mainContainer}>
      <h1 className={styles.heading}>Create Product</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Title & Price */}
        <label className={styles.label}>Title</label>
        <input
          type="text"
          className={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <label className={styles.label}>Base Price</label>
        <input
          type="number"
          step="0.01"
          className={styles.input}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        {/* Default Image */}
        <label className={styles.label}>Default Image</label>
        <input
          type="file"
          accept="image/*"
          className={styles.inputFile}
          onChange={(e) => setDefaultImageFile(e.target.files?.[0] || null)}
        />
        {defaultImagePreview && (
          <div className={styles.previewWrapper}>
            <img src={defaultImagePreview} alt="Preview" className={styles.previewImage} />
          </div>
        )}

        {/* Colors & Variants */}
        <div style={{ marginTop: '1rem' }}>
          <h3>Colors & Variants</h3>
          {colors.map((color, ci) => (
            <div key={ci} style={{ border: '1px solid #D6BCA6', padding: '1rem', marginBottom: '1rem', borderRadius: '10px' }}>
              <label className={styles.label}>Color Name</label>
              <input
                type="text"
                className={styles.input}
                value={color.color}
                onChange={(e) => {
                  const newColors = [...colors]
                  newColors[ci].color = e.target.value
                  setColors(newColors)
                }}
                required
              />

              <label className={styles.label}>Color Image</label>
              <input
                type="file"
                accept="image/*"
                className={styles.inputFile}
                onChange={(e) => {
                  const newColors = [...colors]
                  const file = e.target.files?.[0] || null
                  newColors[ci].imageFile = file
                  if (file) newColors[ci].imagePreview = URL.createObjectURL(file)
                  else newColors[ci].imagePreview = null
                  setColors(newColors)
                }}
              />
              {color.imagePreview && (
                <img src={color.imagePreview} alt="Color Preview" style={{ maxWidth: '150px', margin: '0.5rem 0', borderRadius: '8px' }} />
              )}

              {/* Variants */}
              <h4>Variants</h4>
              {color.variants.map((v, vi) => (
                <div key={vi} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <select
                    value={v.size}
                    onChange={(e) => {
                      const newColors = [...colors]
                      newColors[ci].variants[vi].size = e.target.value
                      setColors(newColors)
                    }}
                    required
                  >
                    <option value="">Select size</option>
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={v.quantity}
                    onChange={(e) => {
                      const newColors = [...colors]
                      newColors[ci].variants[vi].quantity = Number(e.target.value)
                      setColors(newColors)
                    }}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Price Override"
                    value={v.priceOverride || ''}
                    onChange={(e) => {
                      const newColors = [...colors]
                      newColors[ci].variants[vi].priceOverride = Number(e.target.value)
                      setColors(newColors)
                    }}
                  />
                  <button type="button" onClick={() => removeVariant(ci, vi)}>Remove</button>
                </div>
              ))}
              <button type="button" onClick={() => addVariant(ci)}>Add Variant</button>
              <button type="button" style={{ marginLeft: '1rem', background: 'red', color: 'white' }} onClick={() => removeColor(ci)}>Remove Color</button>
            </div>
          ))}
          <button type="button" onClick={addColor}>Add Color</button>
        </div>

        <button type="submit" disabled={loading} className={styles.button} style={{ marginTop: '1rem' }}>
          {loading ? 'Saving...' : 'Create Product'}
        </button>
      </form>
    </div>
  )
}