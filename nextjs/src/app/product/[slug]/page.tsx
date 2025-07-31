import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import type { PageProps } from 'next'

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

async function getProduct(slug: string) {
  const query = `*[_type == "product" && slug.current == $slug][0]{
    title,
    price,
    image,
    description
  }`
  return await client.fetch(query, { slug }, { cache: 'no-store' })
}

// ✅ Correct and Vercel-friendly type definition
export default async function Page({ params }: PageProps<{ slug: string }>) {
  const product = await getProduct(params.slug)

  if (!product) {
    notFound()
  }

  return (
    <main className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8 items-center">
        {product.image && (
          <Image
            src={urlFor(product.image).width(600).height(600).fit('crop').url()}
            alt={product.title}
            width={600}
            height={600}
            className="w-full md:w-1/2 h-auto object-cover rounded-lg shadow"
          />
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
          <p className="text-xl text-gray-700 mb-4">${product.price}</p>
          <p className="text-gray-600 leading-relaxed">{product.description}</p>
        </div>
      </div>
    </main>
  )
}