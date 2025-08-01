import { useRouter } from 'next/router'
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
const urlFor = (source: any) => builder.image(source)

export async function getStaticPaths() {
  const slugs = await client.fetch(`*[_type == "product" && defined(slug.current)][].slug.current`)
  return {
    paths: slugs.map((slug: string) => ({ params: { slug } })),
    fallback: true,
  }
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const query = `*[_type == "product" && slug.current == $slug][0]`
  const product = await client.fetch(query, { slug: params.slug })

  return {
    props: {
      product,
    },
    revalidate: 60,
  }
}

export default function ProductPage({ product }: { product: any }) {
  const router = useRouter()
  if (router.isFallback) return <p>Loading...</p>
  if (!product) return <p>Product not found</p>

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