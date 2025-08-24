// pages/admin/collections.tsx
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { client } from '../../lib/sanityClient'
import styles from '../../styles/admincat.module.css' // reuse styles

interface Product {
  _id: string
  title: string
  defaultImage?: { asset: { url: string } }
}

interface Collection {
  _id: string
  name: string
  description?: string
  slug?: { current: string }
  image?: { asset: { url: string } }
  products?: Product[]
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const [form, setForm] = useState({
    name: '',
    description: '',
    slug: '',
    linkTarget: '',
    image: null as File | null,
    products: [] as string[],
  })

  // Fetch collections and products
  const fetchData = async () => {
    const colData: Collection[] = await client.fetch(`
      *[_type=="collection"]{
        _id, name, description, slug, image, products[]->{_id, title, defaultImage}
      } | order(name asc)
    `)
    setCollections(colData)

    const prodData: Product[] = await client.fetch(`
      *[_type=="product"]{
        _id, title, defaultImage
      } | order(title asc)
    `)
    setProducts(prodData)
  }

  useEffect(() => { fetchData() }, [])

  const resetForm = () => {
    setForm({ name: '', description: '', slug: '', linkTarget: '', image: null, products: [] })
    setSelectedCollection(null)
  }

  const handleSelectCollection = (collection: Collection) => {
    setSelectedCollection(collection)
    setForm({
      name: collection.name,
      description: collection.description || '',
      slug: collection.slug?.current || '',
      linkTarget: '',
      image: null,
      products: collection.products?.map(p => p._id) || [],
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleProductToggle = (productId: string) => {
    setForm(prev => ({
      ...prev,
      products: prev.products.includes(productId)
        ? prev.products.filter(id => id !== productId)
        : [...prev.products, productId],
    }))
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    setIsProcessing(true)

    const payload: any = {
      name: form.name,
      description: form.description,
      slug: { current: form.slug || form.name.toLowerCase().replace(/\s+/g, '-') },
      products: form.products.map(id => ({ _type: 'reference', _ref: id })),
    }

    // Handle image upload if new image is selected
    if (form.image) {
      const formData = new FormData()
      formData.append('file', form.image)
      formData.append('upload_preset', 'YOUR_UPLOAD_PRESET') // for cloudinary if used
      // Upload logic here if needed
    }

    try {
      if (selectedCollection) {
        await fetch(`/api/collections/${selectedCollection._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch(`/api/collections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      await fetchData()
      resetForm()
    } catch (err) {
      console.error(err)
    }

    setIsProcessing(false)
  }

  const handleDelete = async () => {
    if (!selectedCollection) return
    setIsProcessing(true)
    try {
      await fetch(`/api/collections/${selectedCollection._id}`, { method: 'DELETE' })
      await fetchData()
      resetForm()
    } catch (err) {
      console.error(err)
    }
    setIsProcessing(false)
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Collections</h1>
      {isProcessing && <div>Processing...</div>}

      {/* Form */}
      <div className={styles.controls}>
        <input
          name="name"
          placeholder="Collection Name"
          value={form.name}
          onChange={handleInputChange}
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleInputChange}
          rows={3}
        />
        <input
          name="slug"
          placeholder="Slug (auto-generated if empty)"
          value={form.slug}
          onChange={handleInputChange}
        />

        <label>
          Products in Collection:
          <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #D6BCA6', padding: '0.5rem' }}>
            {products.map(prod => (
              <div key={prod._id}>
                <label>
                  <input
                    type="checkbox"
                    checked={form.products.includes(prod._id)}
                    onChange={() => handleProductToggle(prod._id)}
                  />{' '}
                  {prod.title}
                </label>
              </div>
            ))}
          </div>
        </label>

        <button onClick={handleSubmit} disabled={isProcessing || !form.name.trim()}>
          {selectedCollection ? 'Update Collection' : 'Add Collection'}
        </button>
        {selectedCollection && (
          <button onClick={handleDelete} disabled={isProcessing}>
            Delete Collection
          </button>
        )}
        <button onClick={resetForm} disabled={isProcessing}>
          Reset Form
        </button>
      </div>

      {/* Collections List */}
      <div className={styles.treeWrapper} style={{ marginTop: '1rem' }}>
        {collections.map(col => (
          <div
            key={col._id}
            className={`${styles.item} ${selectedCollection?._id === col._id ? styles.selected : ''}`}
            onClick={() => handleSelectCollection(col)}
          >
            <div className={styles.itemContent}>
              {col.image?.asset?.url && (
                <Image src={col.image.asset.url} alt={col.name} width={40} height={40} />
              )}
              <span className={styles.title}>{col.name}</span>
            </div>
            <span>{col.products?.length || 0} products</span>
          </div>
        ))}
      </div>
    </div>
  )
}