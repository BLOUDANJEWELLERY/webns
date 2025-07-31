import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import { notFound } from 'next/navigation'
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

async function getProduct(slug: string) {
  return await client.fetch(
    `*[_type == "product" && slug.current == $slug][0]{
      title,
      price,
      description,
      image
    }`,
    { slug },
    { cache: 'no-store' }
  )
}

// ✅ THIS IS THE CORRECT TYPE
export default async function Page({
  params,
}: {
  params: { slug: string }
}) {
  const product = await getProduct(params.slug)

  if (!product) {
    notFound()
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">{product.title}</h1>
      <p className="text-gray-600">{product.description}</p>
      <p className="text-lg font-medium">${product.price}</p>
      {product.image && (
        <Image
          src={urlFor(product.image).width(800).url()}
          alt={product.title}
          width={800}
          height={600}
        />
      )}
    </main>
  )
}