// src/admin/collections/create.tsx
import { useState } from 'react'
import { useRouter } from 'next/router'
import styles from '../../../styles/admincat.module.css'

export default function CreateCollectionPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [linkTarget, setLinkTarget] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0])
  }

  const handleSubmit = async () => {
    if (!name.trim() || !linkTarget.trim()) {
      alert('Name and Link Target are required')
      return
    }

    setIsProcessing(true)

    let imageAsset: any = null

    // Upload image first if provided
    if (imageFile) {
      const formData = new FormData()
      formData.append('file', imageFile)

      try {
        const res = await fetch('/api/product/uploadImage', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (!data.assetId) throw new Error('Image upload failed')
        imageAsset = { _type: 'image', asset: { _ref: data.assetId, _type: 'reference' } }
      } catch (err) {
        console.error(err)
        alert('Image upload failed')
        setIsProcessing(false)
        return
      }
    }

    // Create collection via backend API
    try {
      const res = await fetch('/api/collections/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, linkTarget, image: imageAsset }),
      })
      const data = await res.json()

      if (!data.success) throw new Error(data.error || 'Creation failed')

      router.push('/admin/collections')
    } catch (err) {
      console.error(err)
      alert('Collection creation failed')
      setIsProcessing(false)
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Create New Collection</h1>

      <div className={styles.controls}>
        <input
          type="text"
          placeholder="Collection Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <textarea
          placeholder="Description"
          rows={3}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <input
          type="text"
          placeholder="Link Target (e.g. /product?category=men)"
          value={linkTarget}
          onChange={e => setLinkTarget(e.target.value)}
        />
        <input type="file" accept="image/*" onChange={handleFileChange} />

        <button
          onClick={handleSubmit}
          disabled={isProcessing || !name.trim() || !linkTarget.trim()}
        >
          {isProcessing ? 'Creating...' : 'Create Collection'}
        </button>
      </div>
    </div>
  )
}