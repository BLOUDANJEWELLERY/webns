// src/pages/admin/[slug].tsx
import { useState } from 'react'
import { useRouter } from 'next/router'
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import styles from '../../styles/adminEdit.module.css'

const client = createClient({
  projectId: '3jc8hsku',
  dataset: 'production',
  apiVersion: '2023-07-30',
  useCdn: false,
})

const builder = imageUrlBuilder(client)
const urlFor = (source: any) => builder.image(source)

export default function EditProduct({ product }: any) {
  const router = useRouter()
  const [title, setTitle] = useState(product.title)
  const [price, setPrice] = useState(product.price)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let imageAssetId = null

      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)
        formData.append('type', 'image')

        const uploadRes = await fetch('../api/products/uploadImage', {
          method: 'POST',
          body: formData,
        })

        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(uploadData.error)
        imageAssetId = uploadData.assetId
      }

      const res = await fetch('../api/products/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product._id,
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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product?')) return

    setLoading(true)
    try {
      const res = await fetch('/api/products/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product._id }),
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
      <h1>Edit Product</h1>
      <form onSubmit={handleUpdate} style={{ maxWidth: 400 }}>
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />

        <label>Price</label>
        <input
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          required
        />

        {product.defaultImage?.asset && !imageFile && (
          <img
            src={urlFor(product.defaultImage).width(200).url()}
            alt={product.title}
            style={{ display: 'block', margin: '1rem 0' }}
          />
        )}

        <label>New Image (optional)</label>
        <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />

        <button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Save Changes'}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          style={{ marginLeft: '1rem', background: 'red', color: 'white' }}
        >
          Delete
        </button>
      </form>
    </div>
  )
}

export async function getServerSideProps({ params }: any) {
  const query = `*[_type == "product" && slug.current == $slug][0]`
  const product = await client.fetch(query, { slug: params.slug })

  if (!product) return { notFound: true }
  return { props: { product } }
}