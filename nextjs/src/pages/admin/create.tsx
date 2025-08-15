// src/pages/admin/create.tsx
import { useState } from 'react'
import { useRouter } from 'next/router'
import styles from '../../styles/admincreate.module.css'

export default function CreateProduct() {
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let imageAssetId = null

      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)
        formData.append('type', 'image')

        const uploadRes = await fetch('/api/products/uploadImage', {
          method: 'POST',
          body: formData,
        })

        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(uploadData.error)
        imageAssetId = uploadData.assetId
      }

      const res = await fetch('/api/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          price: Number(price),
          defaultImage: imageAssetId
            ? { _type: 'image', asset: { _type: 'reference', _ref: imageAssetId } }
            : undefined,
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
      <h1>Create Product</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <label htmlFor="price">Price</label>
        <input
          id="price"
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        <label htmlFor="image">Image</label>
        <input
          id="image"
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Create'}
        </button>
      </form>
    </div>
  )
}