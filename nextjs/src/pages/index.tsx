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
    <main className="px-4 py-6 sm:px-6 md:px-10 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">My Clothing Collection</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((product) => (
          <Link
            key={product._id}
            href={`/product/${product.slug}`}
            className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition duration-300 flex flex-col sm:flex-row overflow-hidden"
          >
            {product.image && (
              <div className="w-full sm:w-1/2 h-48 sm:h-auto">
                <Image
                  src={urlFor(product.image).width(100).height(100).fit('crop').url()}
                  alt={product.title}
                  width={100}
                  height={100}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-4 flex flex-col justify-center items-start sm:w-1/2">
              <h2 className="text-lg font-semibold text-gray-800">{product.title}</h2>
              <p className="text-sm text-gray-600 mt-2">${product.price.toFixed(2)}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}