// src/pages/admin/create.tsx
import { useState } from 'react'
import { useRouter } from 'next/router'
import styles from '../../styles/admincreate.module.css'

type SizeOption = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'

interface Variant {
  color: string
  size: SizeOption
  quantity: number
  priceOverride?: number
}

interface ColorImage {
  color: string
  file: File | null
  preview?: string
}

export default function CreateProduct() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [defaultImage, setDefaultImage] = useState<File | null>(null)
  const [defaultPreview, setDefaultPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [colorImages, setColorImages] = useState<ColorImage[]>([])
  const [variants, setVariants] = useState<Variant[]>([])

  // Default image preview
  const handleDefaultImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setDefaultImage(file)
    if (file) setDefaultPreview(URL.createObjectURL(file))
    else setDefaultPreview(null)
  }

  // Add new color
  const addColor = () => {
    setColorImages([...colorImages, { color: '', file: null, preview: '' }])
  }

  const handleColorChange = (index: number, color: string) => {
    const newColors = [...colorImages]
    newColors[index].color = color
    setColorImages(newColors)
  }

  const handleColorImageChange = (index: number, file: File | null) => {
    const newColors = [...colorImages]
    newColors[index].file = file
    newColors[index].preview = file ? URL.createObjectURL(file) : ''
    setColorImages(newColors)
  }

  // Add variant for a color
  const addVariant = (color: string) => {
    setVariants([...variants, { color, size: 'M', quantity: 0 }])
  }

  const handleVariantChange = (i: number, key: keyof Variant, value: any) => {
    const newVars = [...variants]
    newVars[i][key] = value
    setVariants(newVars)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Upload default image
      let defaultImageAsset: string | null = null
      if (defaultImage) {
        const formData = new FormData()
        formData.append('file', defaultImage)
        formData.append('type', 'image')
        const res = await fetch('/api/products/uploadImage', { method: 'POST', body: formData })
        const data = await res.json()
        defaultImageAsset = data.assetId
      }

      // Upload color images
      const colorImageData: any[] = []
      for (const c of colorImages) {
        let assetId = null
        if (c.file) {
          const formData = new FormData()
          formData.append('file', c.file)
          formData.append('type', 'image')
          const res = await fetch('/api/products/uploadImage', { method: 'POST', body: formData })
          const data = await res.json()
          assetId = data.assetId
        }
        colorImageData.push({ color: c.color, image: assetId ? { _type: 'image', asset: { _type: 'reference', _ref: assetId } } : undefined })
      }

      // Create product
      const res = await fetch('/api/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          price: Number(price),
          defaultImage: defaultImageAsset ? { _type: 'image', asset: { _type: 'reference', _ref: defaultImageAsset } } : undefined,
          colorImages: colorImageData,
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
        <label className={styles.label}>Title</label>
        <input type="text" className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} required />

        <label className={styles.label}>Base Price</label>
        <input type="number" step="0.01" className={styles.input} value={price} onChange={(e) => setPrice(e.target.value)} required />

        <label className={styles.label}>Default Image</label>
        <input type="file" accept="image/*" className={styles.inputFile} onChange={handleDefaultImageChange} />
        {defaultPreview && <img src={defaultPreview} alt="Default" className={styles.previewImage} />}

        <hr />

        <h3>Colors & Variants</h3>
        {colorImages.map((c, i) => (
          <div key={i} className={styles.variantContainer}>
            <input
              type="text"
              placeholder="Color name"
              value={c.color}
              onChange={(e) => handleColorChange(i, e.target.value)}
              className={styles.input}
            />
            <input type="file" accept="image/*" onChange={(e) => handleColorImageChange(i, e.target.files?.[0] || null)} className={styles.inputFile} />
            {c.preview && <img src={c.preview} alt={c.color} className={styles.previewImage} />}

            <button type="button" className={styles.button} onClick={() => addVariant(c.color)}>
              Add Variant (Size & Quantity)
            </button>
          </div>
        ))}
        <button type="button" className={styles.button} onClick={addColor}>
          Add Color
        </button>

        <hr />

        {variants.map((v, i) => (
          <div key={i} className={styles.sizeRow}>
            <span>{v.color}</span>
            <select value={v.size} onChange={(e) => handleVariantChange(i, 'size', e.target.value)} className={styles.input}>
              {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="number" value={v.quantity} min={0} onChange={(e) => handleVariantChange(i, 'quantity', Number(e.target.value))} className={styles.input} />
            <input type="number" placeholder="Price Override" value={v.priceOverride || ''} onChange={(e) => handleVariantChange(i, 'priceOverride', Number(e.target.value))} className={styles.input} />
          </div>
        ))}

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? 'Saving...' : 'Create'}
        </button>
      </form>
    </div>
  )
}