import { useRouter } from 'next/router'
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import Image from 'next/image'
import styles from '../../styles/details.module.css'
// === Sanity client 

const client = createClient({
  projectId: '3jc8hsku',
  dataset: 'production',
  apiVersion: '2023-07-30',
  useCdn: false,
})

const builder = imageUrlBuilder(client)
const urlFor = (source: any) => builder.image(source)

export async function getStaticPaths() {
  const slugs = await client.fetch(
    `*[_type == "product" && defined(slug.current)][].slug.current`
  )

  return {
    paths: slugs.map((slug: string) => ({ params: { slug } })),
    fallback: true,
  }
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const query = `*[_type == "product" && slug.current == $slug][0]{
    _id,
    title,
    price,
    description,
    image
  }`

  const product = await client.fetch(query, { slug: params.slug })

  return {
    props: {
      product,
    },
    revalidate: 60,
  }
}

type Product = {
  _id: string
  title: string
  price: number
  description: string
  image?: any // Must be the raw Sanity image object
}

export default function ProductPage({ product }: { product: Product }) {
  const router = useRouter()

  if (router.isFallback) return <p className="text-center">Loading...</p>
  if (!product) return <p className="text-center">Product not found</p>

  return (
   <main className={styles.container}>
  <div className={styles.productWrapper}>
    {product.image && (
      <div className={styles.imageBox}>
        <Image
          src={urlFor(product.image).width(600).height(600).fit('crop').url()}
          alt={product.title}
          width={600}
          height={600}
          className={styles.productImage}
        />
      </div>
    )}
    <div className={styles.detailsBox}>
      <h1 className={styles.title}>{product.title}</h1>
      <p className={styles.price}>${product.price}</p>
      <p className={styles.description}>{product.description}</p>
      <button className={styles.cartButton}>Add to Cart</button>
    </div>
  </div>
</main>
  )
}