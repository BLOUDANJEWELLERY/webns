// src/admin/collections/create.tsx
import { useState } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import styles from '../../../styles/admincat.module.css'

type Product = {
  _id: string
  title: string
  defaultImage?: any
}

type Props = {
  products: Product[]
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2023-08-01',
  useCdn: false,
})

const builder = imageUrlBuilder(client)
const urlFor = (source: any) => builder.image(source).url()

export default function CreateCollectionPage({ products }: Props) {
  const router = useRouter()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [linkTarget, setLinkTarget] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const [search, setSearch] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0])
      setImagePreview(URL.createObjectURL(e.target.files[0]))
    }
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

    // Upload collection image if provided
    if (imageFile) {
      const formData = new FormData()
      formData.append('file', imageFile)
      formData.append('type', 'image')

      try {
        const res = await fetch('/api/product/uploadImage', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (!res.ok || !data.assetId) throw new Error(data.error || 'Upload failed')
        imageAsset = { _type: 'image', asset: { _ref: data.assetId, _type: 'reference' } }
      } catch (err) {
        console.error(err)
        alert('Image upload failed')
        setIsProcessing(false)
        return
      }
    }

    // Prepare products array with _key for Sanity
    const productsRef = selectedProducts.map(id => ({
      _key: `${id}-${Date.now()}`,
      _type: 'reference',
      _ref: id,
    }))

    // Create collection
    try {
      const res = await fetch('/api/collections/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          linkTarget,
          image: imageAsset,
          products: productsRef,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Creation failed')
      router.push('/admin/collections')
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Collection creation failed')
      setIsProcessing(false)
    }
  }

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
          placeholder="Link Target (e.g. /products?category=men)"
          value={linkTarget}
          onChange={e => setLinkTarget(e.target.value)}
        />
        <input type="file" accept="image/*" onChange={handleFileChange} />

        {imagePreview && (
          <div style={{ marginTop: '10px' }}>
            <Image src={imagePreview} alt="Preview" width={150} height={150} />
          </div>
        )}

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
              {product.defaultImage && (
                <Image
                  src={urlFor(product.defaultImage).width(50).height(50).url()}
                  alt={product.title}
                  width={50}
                  height={50}
                  style={{ marginRight: '10px' }}
                />
              )}
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

// Fetch products server-side
export async function getServerSideProps() {
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
    apiVersion: '2023-08-01',
    useCdn: false,
  })

  const products: Product[] = await client.fetch(`
    *[_type == "product"]{
      _id,
      title,
      defaultImage
    } | order(title asc)
  `)

  return { props: { products } }
}