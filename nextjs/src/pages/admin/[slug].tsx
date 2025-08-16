// src/pages/admin/[slug].tsx
import { useState, useEffect } from 'react'
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

  // === Hooks MUST run before any early return ===
  const [title, setTitle] = useState(product?.title || '')
  const [price, setPrice] = useState(product?.price.toString() || '')
  const [defaultImageFile, setDefaultImageFile] = useState<File | null>(null)
  const [defaultImagePreview, setDefaultImagePreview] = useState(
    product?.defaultImage ? urlFor(product.defaultImage) : null
  )
  const [defaultImageId] = useState(product?.defaultImage?.asset?._ref) // removed setter
  const [colors, setColors] = useState<ColorOption[]>(() => {
    const colorMap: Record<string, ColorOption> = {}
    product?.variants?.forEach(v => {
      if (!colorMap[v.color])
        colorMap[v.color] = {
          color: v.color,
          imageFile: null,
          imagePreview: null,
          existingImageId: undefined,
          variants: [],
          _key: v._key || Math.random().toString(36).substr(2, 9),
        }
      colorMap[v.color].variants.push({ ...v, _key: v._key || Math.random().toString(36).substr(2, 9) })
    })

    const colorImages: ColorOption[] = product?.colorImages?.map(ci => ({
      color: ci.color,
      imageFile: null,
      imagePreview: ci.image ? urlFor(ci.image) : null,
      existingImageId: ci.image?.asset?._ref,
      variants: colorMap[ci.color]?.variants || [],
      _key: ci._key || Math.random().toString(36).substr(2, 9),
    })) || Object.values(colorMap)

    return colorImages
  })
  const [loading, setLoading] = useState(false)

  // === Default image preview effect ===
  useEffect(() => {
    if (!defaultImageFile) return
    const url = URL.createObjectURL(defaultImageFile)
    setDefaultImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [defaultImageFile])

  // === Early return AFTER hooks ===
  if (router.isFallback) return <p>Loading product...</p>
  if (!product) return <p>Product not found</p>

  // === Handlers ===
  const handleDefaultImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setDefaultImageFile(file)
  }

  const addColor = () => {
    setColors([...colors, { color: '', imageFile: null, imagePreview: null, variants: [], _key: Math.random().toString(36).substr(2, 9) }])
  }

  const removeColor = (i: number) => setColors(colors.filter((_, idx) => idx !== i))

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
    })
    setColors(updated)
  }

  const removeVariant = (colorIndex: number, variantIndex: number) => {
    const updated = [...colors]
    updated[colorIndex].variants.splice(variantIndex, 1)
    setColors(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product._id) return alert('Missing product ID')
    setLoading(true)

    try {
      // Upload default image
      let defaultAssetId = defaultImageId
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
        let assetId = color.existingImageId
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

      // Flatten variants
      const variants: any[] = []
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
      )

      // Send update
      const res = await fetch('/api/products/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product._id,
          title,
          price: Number(price),
          defaultImage: defaultAssetId
            ? { _type: 'image', asset: { _type: 'reference', _ref: defaultAssetId } }
            : undefined,
          colorImages,
          variants,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to update product')
      alert('Product updated successfully')
      router.push('/admin')
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
        {/* Title & Price */}
        <label className={styles.label}>Title</label>
        <input className={styles.input} value={title} onChange={e => setTitle(e.target.value)} required />

        <label className={styles.label}>Price</label>
        <input type="number" step="0.01" className={styles.input} value={price} onChange={e => setPrice(e.target.value)} required />

        {/* Default Image */}
        <label className={styles.label}>Default Image</label>
        <input type="file" accept="image/*" onChange={handleDefaultImageChange} />
        {defaultImagePreview && <div style={{ width: 150, height: 150, position: 'relative', marginTop: 5 }}>
          <Image src={defaultImagePreview} alt="Default" fill style={{ objectFit: 'cover', borderRadius: 8 }} />
        </div>}

        {/* Colors & Variants */}
        <h3>Colors & Variants</h3>
        {colors.map((color, ci) => (
          <div key={color._key} style={{ border: '1px solid #D6BCA6', padding: 10, marginBottom: 10, borderRadius: 8 }}>
            <label className={styles.label}>Color Name</label>
            <input className={styles.input} value={color.color} onChange={e => { const updated = [...colors]; updated[ci].color = e.target.value; setColors(updated) }} required />

            <label className={styles.label}>Color Image</label>
            <input type="file" accept="image/*" onChange={e => e.target.files && handleColorImageChange(ci, e.target.files[0])} />
            {color.imagePreview && <div style={{ width: 120, height: 120, position: 'relative', marginTop: 5 }}>
              <Image src={color.imagePreview} alt="Color" fill style={{ objectFit: 'cover', borderRadius: 8 }} />
            </div>}

            <h4>Variants</h4>
            {color.variants.map((v, vi) => (
              <div key={v._key} style={{ display: 'flex', gap: 5, marginBottom: 5 }}>
                <select value={v.size} onChange={e => { const updated = [...colors]; updated[ci].variants[vi].size = e.target.value; setColors(updated) }} required>
                  <option value="">Select size</option>
                  {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input type="number" placeholder="Quantity" value={v.quantity} min={1} onChange={e => { const updated = [...colors]; updated[ci].variants[vi].quantity = Number(e.target.value); setColors(updated) }} required />
                <input type="number" placeholder="Price Override" value={v.priceOverride || ''} onChange={e => { const updated = [...colors]; updated[ci].variants[vi].priceOverride = Number(e.target.value); setColors(updated) }} />
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