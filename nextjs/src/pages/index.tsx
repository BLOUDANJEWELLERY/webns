// pages/index.tsx

import Link from 'next/link'
import Image from 'next/image'
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import styles from '../styles/HomePage.module.css'

// === Sanity client ===
const client = createClient({
  projectId: '3jc8hsku',
  dataset: 'production',
  apiVersion: '2023-07-30',
  useCdn: false,
})

const builder = imageUrlBuilder(client)
const urlFor = (source: any) => builder.image(source)

// === Fetching data server-side ===
export async function getServerSideProps() {
  const query = `*[_type == "product"] | order(title asc){
  _id,
  title,
  price,
  "slug": slug.current,
  image
}`

  const products = await client.fetch(query)
  return { props: { products } }
}

// === TypeScript type ===
type Product = {
  _id: string
  title: string
  price: number
  slug: string
  image?: any
}

// === Main Component ===
export default function HomePage({ products }: { products: Product[] }) {
  return (
    <main className={styles.mainContainer}>
      <h1 className={styles.heading}>Our Clothing Collection</h1>

      <div className={styles.grid}>
        {products.map((product) => (
          <Link key={product._id} href={`/product/${product.slug}`} className={styles.card}>
            {product.image && (
              <div className={styles.imageWrapper}>
                <Image
src={urlFor(product.image).width(300).height(300).fit('fill').url()}
alt={product.title}
width={300}
height={300}
className={styles.image}
/>
              </div>
            )}
            <div className={styles.cardContent}>
              <h2 className={styles.title}>{product.title}</h2>
              <p className={styles.price}>${product.price.toFixed(2)}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}