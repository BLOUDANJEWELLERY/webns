// src/admin/collections/edit/[id].tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import styles from '../../../../styles/admincat.module.css'

type Product = {
  _id: string
  title: string
  defaultImage?: { _id: string; url: string }
}

type Collection = {
  _id: string
  name: string
  description: string
  linkTarget: string
  slug: { _type: string; current: string }
  image?: { asset: { _ref: string } }
  products: Product[]
}

type Props = {
  collection: Collection
  allProducts: Product[]
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2023-08-01',
  useCdn: false,
})

const builder = imageUrlBuilder(client)
const urlFor = (source: any) => builder.image(source).url()

// Simple slugify helper
const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/&/g, '-and-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .slice(0, 96)

export default function EditCollectionPage({ collection, allProducts }: Props) {
  const router = useRouter()
  const { id } = router.query

  const [name, setName] = useState(collection.name)
  const [description, setDescription] = useState(collection.description || '')
  const [linkTarget, setLinkTarget] = useState(collection.linkTarget || '')
  const [slug, setSlug] = useState(collection.slug?.current || '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(
    collection.image ? urlFor(collection.image) : null
  )
  const [isProcessing, setIsProcessing] = useState(false)

  const [search, setSearch] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>(
    collection.products.map(p => p._id)
  )

  // Auto-update slug whenever name changes
  useEffect(() => {
    setSlug(slugify(name))
  }, [name])

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

    let imageAsset: any = collection.image || null

    // Upload new image if chosen
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
        if (!res.ok || !data.assetId) throw new Error(data.error || 'Upload failed')
        imageAsset = { _type: 'image', asset: { _ref: data.assetId, _type: 'reference' } }
      } catch (err) {
        console.error(err)
        alert('Image upload failed')
        setIsProcessing(false)
        return
      }
    }

    const productsRef = selectedProducts.map(id => ({
      _type: 'reference',
      _ref: id,
      _key: `${id}-${Math.random().toString(36).substr(2, 9)}`,
    }))

    try {
      const res = await fetch('/api/collections/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name,
          slug: { _type: 'slug', current: slug },
          description,
          linkTarget,
          image: imageAsset,
          products: productsRef,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      router.push('/admin/collections')
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Collection update failed')
      setIsProcessing(false)
    }
  }

  const filteredProducts = allProducts.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Edit Collection</h1>

      <div className={styles.controls}>
        <input
          type="text"
          placeholder="Collection Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Slug (auto-updates)"
          value={slug}
          readOnly
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
              {product.defaultImage?.url && (
                <Image
                  src={product.defaultImage.url}
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
          {isProcessing ? 'Updating...' : 'Update Collection'}
        </button>
      </div>
    </div>
  )
}

// Fetch collection and all products
export async function getServerSideProps(context: any) {
  const { id } = context.query

  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
    apiVersion: '2023-08-01',
    useCdn: false,
  })

  const collection: Collection = await client.fetch(
    `*[_type=="collection" && _id==$id][0]{
      _id, name, description, linkTarget, slug, image,
      "products": products[]->{_id, title, "defaultImage": defaultImage.asset->{_id,url}}
    }`,
    { id }
  )

  const allProducts: Product[] = await client.fetch(
    `*[_type=="product"]{_id, title, "defaultImage": defaultImage.asset->{_id,url}} | order(title asc)`
  )

  return { props: { collection, allProducts } }
}