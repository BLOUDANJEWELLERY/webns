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
    <main className="px-6 py-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-extrabold text-center mb-12 tracking-wide text-gray-900">
        Our Exclusive Clothing Collection
      </h1>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-y-10 gap-x-8">
        {products.map((product) => (
          <Link
            key={product._id}
            href={`/product/${product.slug}`}
            className="group flex flex-col border border-gray-300 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden"
          >
            {product.image ? (
              <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
                <Image
                  src={urlFor(product.image).width(600).height(600).fit('crop').url()}
                  alt={product.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  priority
                />
              </div>
            ) : (
              <div className="w-full aspect-square bg-gray-200 flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}

            <div className="p-6 flex flex-col flex-grow">
              <h2 className="text-xl font-semibold text-gray-900 mb-2 truncate">{product.title}</h2>
              <p className="text-gray-700 font-medium text-lg">${product.price.toFixed(2)}</p>
              <button
                className="mt-auto mt-4 py-2 px-4 bg-indigo-600 text-white rounded-md font-semibold text-center
                  hover:bg-indigo-700 transition-colors duration-300"
                aria-label={`View details of ${product.title}`}
              >
                View Details
              </button>
            </div>
          </Link>
        ))}
      </section>
    </main>
  )
}