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
    <main className="px-4 py-6 sm:px-6 md:px-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-10">My Clothing Collection</h1>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.map((product) => (
          <Link
            key={product._id}
            href={`/product/${product.slug}`}
            className="bg-white border rounded-lg shadow-sm hover:shadow-md transition duration-300 flex flex-col"
          >
            {product.image && (
              <div className="w-full h-40 overflow-hidden rounded-t-lg">
                <Image
                  src={urlFor(product.image).width(300).height(300).fit('crop').url()}
                  alt={product.title}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-3">
              <h2 className="text-sm font-semibold text-gray-800 truncate">{product.title}</h2>
              <p className="text-xs text-gray-600 mt-1">${product.price.toFixed(2)}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}