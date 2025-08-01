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
    <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">Our Clothing Collection</h1>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.map((product) => (
          <Link
            key={product._id}
            href={`/product/${product.slug}`}
            className="border rounded-lg shadow-sm hover:shadow-md transition-all duration-300 bg-white flex flex-col"
          >
            {product.image && (
              <Image
                src={urlFor(product.image).width(400).height(400).fit('crop').url()}
                alt={product.title}
                width={400}
                height={400}
                className="w-full h-48 object-cover rounded-t-lg"
              />
            )}
            <div className="p-3 flex-1 flex flex-col justify-between text-center">
              <h2 className="text-base font-medium text-gray-900">{product.title}</h2>
              <p className="text-sm text-gray-600 mt-1">${product.price.toFixed(2)}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}