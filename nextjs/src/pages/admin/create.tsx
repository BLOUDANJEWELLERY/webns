import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import styles from '../../styles/adminCreate.module.css'

export default function CreateProduct() {
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Generate image preview when a new file is selected
  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null)
      return
    }

    const previewUrl = URL.createObjectURL(imageFile)
    setImagePreview(previewUrl)

    // Cleanup on unmount or file change
    return () => URL.revokeObjectURL(previewUrl)
  }, [imageFile])

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

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
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

        <label className={styles.label}>Image</label>
        <input
          type="file"
          accept="image/*"
          className={styles.inputFile}
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />

        {imagePreview && (
          <div className={styles.previewWrapper}>
            <img
              src={imagePreview}
              alt="Preview"
              className={styles.previewImage}
            />
            <button
              type="button"
              className={styles.removeButton}
              onClick={handleRemoveImage}
            >
              Remove Image
            </button>
          </div>
        )}

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? 'Saving...' : 'Create'}
        </button>
      </form>
    </div>
  )
}