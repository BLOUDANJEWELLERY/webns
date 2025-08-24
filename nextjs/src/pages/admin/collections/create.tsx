// src/admin/collections/create.tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import styles from '../../../styles/admincat.module.css'

type Product = {
  _id: string
  title: string
  defaultImage?: { asset: { _ref: string } }
}

export default function CreateCollectionPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [linkTarget, setLinkTarget] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products/list')
        const data = await res.json()
        setProducts(data.products || [])
      } catch (err) {
        console.error(err)
      }
    }
    fetchProducts()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0])
  }

  const toggleProductSelection = (id: string) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
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
      formData.append('type', 'image')

      try {
        const res = await fetch('/api/products/uploadImage', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        imageAsset = {
          _type: 'image',
          asset: { _type: 'reference', _ref: data.assetId },
        }
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
        body: JSON.stringify({
          name,
          description,
          linkTarget,
          image: imageAsset,
          products: selectedProducts.map(id => ({
            _type: 'reference',
            _ref: id,
          })),
        }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Creation failed')

      router.push('/admin/collections')
    } catch (err) {
      console.error(err)
      alert('Collection creation failed')
      setIsProcessing(false)
    }
  }

  // Filtered products
  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  )

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

        <h3>Select Products</h3>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className={styles.productList}>
          {filteredProducts.map(product => (
            <label key={product._id} className={styles.productItem}>
              <input
                type="checkbox"
                checked={selectedProducts.includes(product._id)}
                onChange={() => toggleProductSelection(product._id)}
              />
              {product.title}
            </label>
          ))}
        </div>

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