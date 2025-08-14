import { useState } from 'react'
import { createClient } from 'next-sanity'
import styles from '../styles/HomePage.module.css'

// Sanity client for reading only (SSR)
const client = createClient({
  projectId: '3jc8hsku',
  dataset: 'production',
  apiVersion: '2023-07-30',
  useCdn: false,
})

type Product = {
  _id: string
  title: string
  price: number
}

export default function AdminPage({ products: initialProducts }: { products: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [newTitle, setNewTitle] = useState('')
  const [newPrice, setNewPrice] = useState('')

  const fetchProducts = async () => {
    const data: Product[] = await client.fetch(
      `*[_type == "product"] | order(title asc){_id, title, price}`
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
        {products.map((p) => (
          <li key={p._id} style={{ marginBottom: '1rem' }}>
            {p.title} - KWD {p.price.toFixed(2)}{' '}
            <button onClick={() => deleteProduct(p._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Server-side fetch
export async function getServerSideProps() {
  const productQuery = `*[_type == "product"] | order(title asc){_id, title, price}`
  const products: Product[] = await client.fetch(productQuery)
  return { props: { products } }
}