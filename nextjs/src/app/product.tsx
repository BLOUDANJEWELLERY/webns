'use client'

import { useState, useEffect } from 'react'
import imageUrlBuilder from '@sanity/image-url'
import { createClient } from 'next-sanity'

const client = createClient({
    projectId: '3jc8hsku', // replace with yours
  dataset: 'production',
  useCdn: false,
    apiVersion: '2023-07-30',
    token: process.env.NEXT_PUBLIC_SANITY_TOKEN || process.env.SANITY_WRITE_TOKEN,
})

const builder = imageUrlBuilder(client)
function urlFor(source: any) {
  return builder.image(source)
}

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [form, setForm] = useState({ title: '', price: '', description: '' })

  useEffect(() => {
    client.fetch(`*[_type == "product"]{_id, title, price, description, image}`)
      .then(setProducts)
  }, [])

  async function handleSubmit(e: any) {
    e.preventDefault()
    await client.create({
      _type: 'product',
      title: form.title,
      price: parseFloat(form.price),
      description: form.description
    })
    setForm({ title: '', price: '', description: '' })
    const updated = await client.fetch(`*[_type == "product"]{_id, title, price, description, image}`)
    setProducts(updated)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Add Product</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="text" placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="border p-2 w-full" />
        <input type="number" placeholder="Price" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="border p-2 w-full" />
        <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="border p-2 w-full" />
        <button type="submit" className="bg-black text-white px-4 py-2">Add</button>
      </form>

      <h2 className="text-xl font-semibold mt-10 mb-2">Product List</h2>
      <ul className="space-y-4">
        {products.map(product => (
          <li key={product._id} className="border p-4">
            <h3 className="text-lg font-bold">{product.title}</h3>
            <p>${product.price}</p>
            <p>{product.description}</p>
            {product.image && <img src={urlFor(product.image).width(200).url()} alt={product.title} />}
          </li>
        ))}
      </ul>
    </div>
  )
}
