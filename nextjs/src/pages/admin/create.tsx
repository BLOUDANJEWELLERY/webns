import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import styles from '../../styles/admincreate.module.css'

type Variant = {
  color: string
  imageFile: File | null
  imagePreview: string | null
  sizes: { size: string; quantity: number }[]
}

const availableSizes = ['S', 'M', 'L', 'XL', 'XXL']

export default function CreateProduct() {
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [variants, setVariants] = useState<Variant[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleAddColor = () => {
    setVariants([
      ...variants,
      { color: '', imageFile: null, imagePreview: null, sizes: [] },
    ])
  }

  const handleRemoveColor = (index: number) => {
    const newVariants = [...variants]
    newVariants.splice(index, 1)
    setVariants(newVariants)
  }

  const handleColorChange = (index: number, value: string) => {
    const newVariants = [...variants]
    newVariants[index].color = value
    setVariants(newVariants)
  }

  const handleImageChange = (index: number, file: File | null) => {
    const newVariants = [...variants]
    newVariants[index].imageFile = file
    newVariants[index].imagePreview = file ? URL.createObjectURL(file) : null
    setVariants(newVariants)
  }

  const handleSizeQuantityChange = (
    variantIndex: number,
    size: string,
    quantity: number
  ) => {
    const newVariants = [...variants]
    const sizeObjIndex = newVariants[variantIndex].sizes.findIndex(
      (s) => s.size === size
    )
    if (sizeObjIndex >= 0) {
      newVariants[variantIndex].sizes[sizeObjIndex].quantity = quantity
    } else {
      newVariants[variantIndex].sizes.push({ size, quantity })
    }
    setVariants(newVariants)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Upload images for each color
      const variantData = []
      for (const v of variants) {
        let imageAssetId = null
        if (v.imageFile) {
          const formData = new FormData()
          formData.append('file', v.imageFile)
          formData.append('type', 'image')

          const uploadRes = await fetch('/api/products/uploadImage', {
            method: 'POST',
            body: formData,
          })
          const uploadData = await uploadRes.json()
          if (!uploadRes.ok) throw new Error(uploadData.error)
          imageAssetId = uploadData.assetId
        }
        variantData.push({
          color: v.color,
          image: imageAssetId
            ? { _type: 'image', asset: { _type: 'reference', _ref: imageAssetId } }
            : undefined,
          sizes: v.sizes,
        })
      }

      // Create product
      const res = await fetch('/api/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          price: Number(price),
          variants: variantData,
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
        <input
          type="text"
          className={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <label className={styles.label}>Price</label>
        <input
          type="number"
          step="0.01"
          className={styles.input}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        <h3>Variants</h3>
        {variants.map((v, idx) => (
          <div
            key={idx}
            style={{
              border: '1px solid #D6BCA6',
              borderRadius: '10px',
              padding: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <label className={styles.label}>Color</label>
            <input
              type="text"
              className={styles.input}
              value={v.color}
              onChange={(e) => handleColorChange(idx, e.target.value)}
              required
            />

            <label className={styles.label}>Image</label>
            <input
              type="file"
              accept="image/*"
              className={styles.inputFile}
              onChange={(e) =>
                handleImageChange(idx, e.target.files?.[0] || null)
              }
            />
            {v.imagePreview && (
              <div className={styles.previewWrapper}>
                <img
                  src={v.imagePreview}
                  alt={`Preview ${v.color}`}
                  className={styles.previewImage}
                />
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => handleImageChange(idx, null)}
                >
                  Remove Image
                </button>
              </div>
            )}

            <h4>Sizes & Quantity</h4>
            {availableSizes.map((size) => (
              <div key={size} style={{ marginBottom: '0.5rem' }}>
                <label>{size}</label>
                <input
                  type="number"
                  min={0}
                  className={styles.input}
                  value={
                    v.sizes.find((s) => s.size === size)?.quantity || 0
                  }
                  onChange={(e) =>
                    handleSizeQuantityChange(idx, size, Number(e.target.value))
                  }
                />
              </div>
            ))}

            <button
              type="button"
              className={styles.removeButton}
              style={{ marginTop: '0.5rem' }}
              onClick={() => handleRemoveColor(idx)}
            >
              Remove Color
            </button>
          </div>
        ))}

        <button
          type="button"
          className={styles.button}
          onClick={handleAddColor}
          style={{ marginBottom: '1rem' }}
        >
          Add Color
        </button>

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? 'Saving...' : 'Create'}
        </button>
      </form>
    </div>
  )
}