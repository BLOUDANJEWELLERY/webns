import Link from 'next/link'
import Image from 'next/image'
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'

const client = createClient({
  projectId: '3jc8hsku',
  dataset: 'production',
  apiVersion: '2023-07-30',
  useCdn: false,
})

const builder = imageUrlBuilder(client)
const urlFor = (source: any) => builder.image(source)

export async function getStaticProps() {
  const query = `*[_type == "product"]{
    _id,
    title,
    price,
    "slug": slug.current,
    image
  }`
  const products = await client.fetch(query)
  return { props: { products } }
}

type Product = {
  _id: string
  title: string
  price: number
  slug: string
  image?: any
}

export default function HomePage({ products }: { products: Product[] }) {
  return (
    <main className="px-4 py-6 sm:px-6 md:px-10 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">Our Clothing Collection</h1>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Link
            key={product._id}
            href={`/product/${product.slug}`}
            className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition duration-300 flex flex-col overflow-hidden"
          >
            {product.image && (
              <Image
                src={urlFor(product.image).width(400).height(400).fit('crop').url()}
                alt={product.title}
                width={400}
                height={400}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4 flex flex-col items-center">
              <h2 className="text-md font-semibold text-gray-800 text-center">{product.title}</h2>
              <p className="text-sm text-gray-600 mt-1">${product.price.toFixed(2)}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}