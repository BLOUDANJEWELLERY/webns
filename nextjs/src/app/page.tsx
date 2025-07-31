import Link from 'next/link'
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import Image from 'next/image'

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

async function getProducts() {
  const query = `*[_type == "product"]{_id, title, price, description, "slug": slug.current, image}`
  return await client.fetch(query, {}, { cache: 'no-store' })
}

export default async function HomePage() {
  const products = await getProducts()

  return (
    <main className="p-4 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">Our Clothing Collection</h1>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((product: any) => (
          <Link
            key={product._id}
            href={`/product/${product.slug}`}
            className="block group border rounded-xl overflow-hidden shadow hover:shadow-lg transition duration-300"
          >
            {product.image && (
              <Image
                src={urlFor(product.image).width(400).height(400).fit('crop').url()}
                alt={product.title}
                width={400}
                height={400}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
            )}
            <div className="p-4 text-center">
              <h2 className="text-lg font-semibold">{product.title}</h2>
              <p className="text-gray-700 font-medium mt-1">${product.price}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}