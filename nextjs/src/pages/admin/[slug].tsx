// pages/admin/edit/[id].tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import styles from '../../styles/adminCreate.module.css'
import { client } from '../../lib/sanityClient'
import imageUrlBuilder from '@sanity/image-url'

const builder = imageUrlBuilder(client)
const urlFor = (source: any) => builder.image(source).width(300).url()

interface Variant {
  size: string
  quantity: number
  priceOverride?: number
  sku?: string
}

interface ColorOption {
  color: string
  imageFile: File | null
  imagePreview: string | null
  existingImage?: any
  variants: Variant[]
}

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export default function EditProductPage() {
  const router = useRouter()
  const { id } = router.query

  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [defaultImageFile, setDefaultImageFile] = useState<File | null>(null)
  const [defaultImagePreview, setDefaultImagePreview] = useState<string | null>(null)
  const [existingDefaultImage, setExistingDefaultImage] = useState<any>(null)
  const [colors, setColors] = useState<ColorOption[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    async function fetchProduct() {
      const data = await client.fetch('*[_type=="product" && _id==$id][0]', { id })
      if (!data) return router.push('/admin/products')

      setTitle(data.title || '')
      setPrice(data.price?.toString() || '')
      if (data.defaultImage) setDefaultImagePreview(urlFor(data.defaultImage))
      setExistingDefaultImage(data.defaultImage || null)

      // Map variants per color
      const colorMap: Record<string, ColorOption> = {}
      data.variants?.forEach((v: Variant & { color: string }) => {
        if (!colorMap[v.color])
          colorMap[v.color] = { color: v.color, imageFile: null, imagePreview: null, existingImage: null, variants: [] }
        colorMap[v.color].variants.push({
          size: v.size,
          quantity: v.quantity,
          priceOverride: v.priceOverride,
          sku: v.sku,
        })
      })

      const colorImages: ColorOption[] = data.colorImages?.map((ci: any) => ({
        color: ci.color,
        imageFile: null,
        imagePreview: ci.image ? urlFor(ci.image) : null,
        existingImage: ci.image || null,
        variants: colorMap[ci.color]?.variants || [],
      })) || Object.values(colorMap)

      setColors(colorImages)
    }
    fetchProduct()
  }, [id])

  // Default image preview
  const handleDefaultImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setDefaultImageFile(file)
    setDefaultImagePreview(file ? URL.createObjectURL(file) : existingDefaultImage ? urlFor(existingDefaultImage) : null)
  }

  // Color image handlers
  const addColor = () => setColors([...colors, { color: '', imageFile: null, imagePreview: null, variants: [] }])
  const removeColor = (index: number) => setColors(colors.filter((_, i) => i !== index))
  const handleColorImageChange = (colorIndex: number, file: File) => {
    const updated = [...colors]
    updated[colorIndex].imageFile = file
    updated[colorIndex].imagePreview = URL.createObjectURL(file)
    setColors(updated)
  }

  // Variant handlers
  const addVariant = (colorIndex: number) => {
    const updated = [...colors]
    updated[colorIndex].variants.push({ size: '', quantity: 1 })
    setColors(updated)
  }
  const removeVariant = (colorIndex: number, variantIndex: number) => {
    const updated = [...colors]
    updated[colorIndex].variants.splice(variantIndex, 1)
    setColors(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      let defaultImageAsset = existingDefaultImage
      if (defaultImageFile) {
        defaultImageAsset = await client.assets.upload('image', defaultImageFile, { filename: defaultImageFile.name })
      }

      const colorImages: any[] = []
      for (const color of colors) {
        let asset = color.existingImage
        if (color.imageFile) {
          asset = await client.assets.upload('image', color.imageFile, { filename: `${color.color}.png` })
        }
        colorImages.push({
          color: color.color,
          image: asset ? { _type: 'image', asset: { _type: 'reference', _ref: asset._id } } : undefined,
        })
      }

      const variants: any[] = []
      colors.forEach((color) => {
        color.variants.forEach((v) => {
          variants.push({
            color: color.color,
            size: v.size,
            quantity: Number(v.quantity),
            priceOverride: v.priceOverride ? Number(v.priceOverride) : undefined,
            sku: v.sku || `${color.color}-${v.size}-${Math.floor(Math.random() * 1000000)}`,
          })
        })
      })

      const res = await fetch('/api/products/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          title,
          price: Number(price),
          defaultImage: defaultImageAsset ? { _type: 'image', asset: { _type: 'reference', _ref: defaultImageAsset._id } } : undefined,
          colorImages,
          variants,
        }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to update product')
      alert('Product updated successfully')
      router.push('/admin/products')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.mainContainer}>
      <h1 className={styles.heading}>Edit Product</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label}>Title</label>
        <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} required />

        <label className={styles.label}>Price</label>
        <input type="number" step="0.01" className={styles.input} value={price} onChange={(e) => setPrice(e.target.value)} required />

        <label className={styles.label}>Default Image</label>
        <input type="file" accept="image/*" className={styles.inputFile} onChange={handleDefaultImageChange} />
        {defaultImagePreview && <img src={defaultImagePreview} alt="Default" style={{ width: 150, marginTop: 5, borderRadius: 8 }} />}

        <h3>Colors & Variants</h3>
        {colors.map((color, ci) => (
          <div key={ci} style={{ border: '1px solid #D6BCA6', padding: 10, marginBottom: 10, borderRadius: 8 }}>
            <label className={styles.label}>Color Name</label>
            <input className={styles.input} value={color.color} onChange={(e) => {
              const updated = [...colors]
              updated[ci].color = e.target.value
              setColors(updated)
            }} required />

            <label className={styles.label}>Color Image</label>
            <input type="file" accept="image/*" onChange={(e) => e.target.files && handleColorImageChange(ci, e.target.files[0])} />
            {color.imagePreview && <img src={color.imagePreview} alt="Color" style={{ width: 120, marginTop: 5, borderRadius: 8 }} />}

            <h4>Variants</h4>
            {color.variants.map((v, vi) => (
              <div key={vi} style={{ display: 'flex', gap: 5, marginBottom: 5 }}>
                <select value={v.size} onChange={(e) => {
                  const updated = [...colors]
                  updated[ci].variants[vi].size = e.target.value
                  setColors(updated)
                }} required>
                  <option value="">Select size</option>
                  {SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input type="number" placeholder="Quantity" value={v.quantity} min={1} onChange={(e) => {
                  const updated = [...colors]
                  updated[ci].variants[vi].quantity = Number(e.target.value)
                  setColors(updated)
                }} required />
                <input type="number" placeholder="Price Override" value={v.priceOverride || ''} onChange={(e) => {
                  const updated = [...colors]
                  updated[ci].variants[vi].priceOverride = Number(e.target.value)
                  setColors(updated)
                }} />
                <button type="button" onClick={() => removeVariant(ci, vi)}>Remove</button>
              </div>
            ))}
            <button type="button" onClick={() => addVariant(ci)}>Add Variant</button>
            <button type="button" style={{ marginLeft: 10, background: 'red', color: 'white' }} onClick={() => removeColor(ci)}>Remove Color</button>
          </div>
        ))}
        <button type="button" onClick={addColor}>Add Color</button>

        <button type="submit" disabled={loading} className={styles.button} style={{ marginTop: 10 }}>
          {loading ? 'Updating...' : 'Update Product'}
        </button>
      </form>
    </div>
  )
}