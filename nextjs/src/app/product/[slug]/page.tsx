// app/product/[slug]/page.tsx
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import { notFound } from 'next/navigation'

const client = createClient({
  projectId: '3jc8hsku',
  dataset: 'production',
  apiVersion: '2023-07-30',
  useCdn: false,
})

const builder = imageUrlBuilder(client)
function urlFor(source: any) {
  return builder.image(source)
}

interface Product {
  title: string
  price: number
  description: string
  image: any
}

// Force this page to always be dynamic
export const dynamic = 'force-dynamic'

// Hardcoded slug: "necklace"
export default async function ProductPage() {
  const query = `
    *[_type == "product" && slug.current == "necklace"][0]{
      title, price, description, image
    }
  `
  const product: Product = await client.fetch(query)

  if (!product) return notFound()

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
      {product.image && (
        <img
          src={urlFor(product.image).width(800).url()}
          alt={product.title}
          className="w-full rounded-lg shadow mb-6"
        />
      )}
      <p className="text-xl text-gray-800 font-semibold mb-2">${product.price}</p>
      <p className="text-gray-600 leading-relaxed">{product.description}</p>
    </main>
  )
}