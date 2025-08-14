import { useState } from 'react'
import Image from 'next/image'
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import styles from '../../styles/HomePage.module.css'

const client = createClient({
  projectId: '3jc8hsku',
  dataset: 'production',
  apiVersion: '2023-07-30',
  useCdn: false,
})

const builder = imageUrlBuilder(client)
const urlFor = (source: any) => builder.image(source)

type Product = {
  _id: string
  title: string
  price: number
  slug: string
  defaultImage?: any
}

export default function AdminPage({ products: initialProducts }: { products: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [newTitle, setNewTitle] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editImage, setEditImage] = useState<File | null>(null)

  const fetchProducts = async () => {
    const data: Product[] = await client.fetch(
      `*[_type == "product"] | order(title asc){
        _id,
        title,
        price,
        "slug": slug.current,
        defaultImage
      }`
    )
    setProducts(data)
  }

  const addProduct = async () => {
    if (!newTitle || !newPrice) return
    try {
      const res = await fetch('/api/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, price: Number(newPrice) }),
      })
      if (!res.ok) throw new Error('Failed to create product')
      setNewTitle('')
      setNewPrice('')
      fetchProducts()
    } catch (err) {
      console.error(err)
      alert('Error creating product')
    }
  }

  const deleteProduct = async (id: string) => {
    try {
      const res = await fetch('/api/products/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('Failed to delete product')
      fetchProducts()
    } catch (err) {
      console.error(err)
      alert('Error deleting product')
    }
  }

  const startEdit = (product: Product) => {
    setEditingId(product._id)
    setEditTitle(product.title)
    setEditPrice(product.price.toString())
    setEditImage(null)
  }

  const submitEdit = async (id: string) => {
    let defaultImageData: any = undefined

    // Upload image if selected
    if (editImage) {
      // Create FormData and POST to Sanity asset API
      const formData = new FormData()
      formData.append('file', editImage)
      formData.append('content-type', editImage.type)

      const res = await fetch(
        `https://${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}.api.sanity.io/v2023-07-30/assets/images/${process.env.NEXT_PUBLIC_SANITY_DATASET}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.SANITY_API_TOKEN}` },
          body: formData,
        }
      )
      defaultImageData = await res.json()
    }

    try {
      const res = await fetch('/api/products/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          title: editTitle,
          price: Number(editPrice),
          defaultImage: defaultImageData?.document,
        }),
      })
      if (!res.ok) throw new Error('Failed to update product')
      setEditingId(null)
      fetchProducts()
    } catch (err) {
      console.error(err)
      alert('Error updating product')
    }
  }

  return (
    <div className={styles.mainContainer}>
      <h1 className={styles.heading}>Admin Panel</h1>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Add New Product</h2>
        <input
          placeholder="Product Title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <input
          placeholder="Price"
          type="number"
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
        />
        <button onClick={addProduct}>Add Product</button>
      </div>

      <h2>All Products</h2>
      <div className={styles.grid}>
        {products.map((product) => (
          <div key={product._id} className={styles.card}>
            {product.defaultImage?.asset && (
              <div className={styles.imageWrapper}>
                <Image
                  src={urlFor(product.defaultImage).width(300).height(300).fit('scale').url()}
                  alt={product.title}
                  width={300}
                  height={300}
                  className={styles.image}
                />
              </div>
            )}
            <div className={styles.cardContent}>
              {editingId === product._id ? (
                <>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEditImage(e.target.files?.[0] || null)}
                  />
                  <button onClick={() => submitEdit(product._id)}>Save</button>
                  <button onClick={() => setEditingId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <h2 className={styles.title}>{product.title}</h2>
                  <p className={styles.price}>KWD {product.price.toFixed(2)}</p>
                  <div style={{ marginTop: '0.5rem' }}>
                    <button onClick={() => startEdit(product)}>Edit</button>
                    <button
                      onClick={() => deleteProduct(product._id)}
                      style={{ background: 'red', color: 'white', padding: '0.5rem', marginLeft: '0.5rem' }}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export async function getServerSideProps() {
  const productQuery = `*[_type == "product"] | order(title asc){
    _id,
    title,
    price,
    "slug": slug.current,
    defaultImage
  }`
  const products: Product[] = await client.fetch(productQuery)
  return { props: { products } }
}