import { useState } from 'react'
import { useRouter } from 'next/router'
import styles from '../../../styles/adminEdit.module.css'

export default function EditProduct({ product }: { product: any }) {
  const router = useRouter()
  
  // Local state for all product fields
  const [title, setTitle] = useState(product.title || '')
  const [description, setDescription] = useState(product.description || '')
  const [price, setPrice] = useState(product.price || 0)
  const [slug, setSlug] = useState(product.slug?.current || '')
  
  // Default image
  const [defaultImage, setDefaultImage] = useState<any>(product.defaultImage || null)
  const [defaultImageFile, setDefaultImageFile] = useState<File | null>(null)

  // Color images
  const [colorImages, setColorImages] = useState<any[]>(product.colorImages || [])

  // Variants
  const [variants, setVariants] = useState<any[]>(product.variants || [])

  const handleDefaultImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setDefaultImageFile(e.target.files[0])
      setDefaultImage(URL.createObjectURL(e.target.files[0]))
    }
  }

  const handleColorImageChange = (index: number, file: File) => {
    const updated = [...colorImages]
    updated[index].imageFile = file
    updated[index].image = URL.createObjectURL(file)
    setColorImages(updated)
  }

  const addColorImage = () => {
    setColorImages([...colorImages, { color: '', image: null, imageFile: null }])
  }

  const removeColorImage = (index: number) => {
    setColorImages(colorImages.filter((_, i) => i !== index))
  }

  const handleVariantChange = (index: number, field: string, value: any) => {
    const updated = [...variants]
    updated[index][field] = value
    setVariants(updated)
  }

  const addVariant = () => {
    setVariants([...variants, { color: '', size: '', quantity: 0, priceOverride: null }])
  }

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    const formData = new FormData()
    formData.append('id', product._id)
    formData.append('title', title)
    formData.append('description', description)
    formData.append('price', price.toString())
    formData.append('slug', slug)

    if (defaultImageFile) formData.append('defaultImage', defaultImageFile)

    formData.append('colorImages', JSON.stringify(
      colorImages.map(({ color }) => ({ color }))
    ))

    colorImages.forEach((ci, idx) => {
      if (ci.imageFile) formData.append(`colorImageFile_${idx}`, ci.imageFile)
    })

    formData.append('variants', JSON.stringify(variants))

    const res = await fetch('/api/products/update', {
      method: 'POST',
      body: formData
    })

    if (res.ok) {
      alert('Product updated successfully!')
      router.push('/admin/products')
    } else {
      alert('Error updating product')
    }
  }

  return (
    <div className={styles.container}>
      <h1>Edit Product</h1>

      <label>Title</label>
      <input value={title} onChange={e => setTitle(e.target.value)} />

      <label>Description</label>
      <textarea value={description} onChange={e => setDescription(e.target.value)} />

      <label>Base Price</label>
      <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} />

      <label>Slug</label>
      <input value={slug} onChange={e => setSlug(e.target.value)} />

      <label>Default Image</label>
      {defaultImage && <img src={defaultImage.asset?.url || defaultImage} className={styles.preview} />}
      <input type="file" accept="image/*" onChange={handleDefaultImageChange} />

      <h3>Color Images</h3>
      {colorImages.map((ci, index) => (
        <div key={index} className={styles.colorImageRow}>
          <input
            placeholder="Color"
            value={ci.color}
            onChange={e => {
              const updated = [...colorImages]
              updated[index].color = e.target.value
              setColorImages(updated)
            }}
          />
          {ci.image && <img src={ci.image.asset?.url || ci.image} className={styles.previewSmall} />}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files && handleColorImageChange(index, e.target.files[0])}
          />
          <button type="button" onClick={() => removeColorImage(index)}>Remove</button>
        </div>
      ))}
      <button type="button" onClick={addColorImage}>+ Add Color Image</button>

      <h3>Variants</h3>
      {variants.map((v, index) => (
        <div key={index} className={styles.variantRow}>
          <input placeholder="Color" value={v.color} onChange={e => handleVariantChange(index, 'color', e.target.value)} />
          <input placeholder="Size" value={v.size} onChange={e => handleVariantChange(index, 'size', e.target.value)} />
          <input type="number" placeholder="Quantity" value={v.quantity} onChange={e => handleVariantChange(index, 'quantity', Number(e.target.value))} />
          <input type="number" placeholder="Price Override" value={v.priceOverride || ''} onChange={e => handleVariantChange(index, 'priceOverride', Number(e.target.value) || null)} />
          <button type="button" onClick={() => removeVariant(index)}>Remove</button>
        </div>
      ))}
      <button type="button" onClick={addVariant}>+ Add Variant</button>

      <br />
      <button onClick={handleSave} className={styles.saveBtn}>Save Changes</button>
    </div>
  )
}

export async function getServerSideProps({ params }: any) {
  const { id } = params
  const query = encodeURIComponent(`*[_type == "product" && _id == "${id}"][0]`)
  const url = `https://${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}.api.sanity.io/v2023-01-01/data/query/production?query=${query}`
  const res = await fetch(url)
  const { result } = await res.json()

  return {
    props: {
      product: result || {}
    }
  }
}