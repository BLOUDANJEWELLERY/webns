// src/pages/admin.tsx
import { useState } from 'react'
import { createClient } from 'next-sanity'
import styles from '../styles/HomePage.module.css'

// === Sanity client ===
const client = createClient({
  projectId: '3jc8hsku',
  dataset: 'production',
  apiVersion: '2023-07-30',
  useCdn: false,
})

// === Types ===
type Product = {
  _id: string
  title: string
  price: number
  slug: { current: string }
}

// === Admin Page Component ===
export default function AdminPage({ products: initialProducts }: { products: Product[] }) {
  const [products, setProducts] = useState(initialProducts)
  const [newTitle, setNewTitle] = useState('')
  const [newPrice, setNewPrice] = useState('')

  // Create product
  const addProduct = async () => {
    if (!newTitle || !newPrice) return
    const doc = await client.create({
      _type: 'product',
      title: newTitle,
      price: Number(newPrice),
      slug: { current: newTitle.toLowerCase().replace(/\s+/g, '-') }
    })
    setProducts([...products, doc])
    setNewTitle('')
    setNewPrice('')
  }

  // Delete product
  const deleteProduct = async (id: string) => {
    await client.delete(id)
    setProducts(products.filter(p => p._id !== id))
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

      <h2>Existing Products</h2>
      <ul>
        {products.map(p => (
          <li key={p._id} style={{ marginBottom: '1rem' }}>
            {p.title} - KWD {p.price.toFixed(2)}{' '}
            <button onClick={() => deleteProduct(p._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

// === Server-Side Data Fetching ===
export async function getServerSideProps() {
  const productQuery = `*[_type == "product"] | order(title asc){
    _id,
    title,
    price,
    slug
  }`
  const products = await client.fetch(productQuery)
  return { props: { products } }
}