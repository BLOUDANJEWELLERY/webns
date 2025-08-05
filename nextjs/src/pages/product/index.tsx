// src/pages/product/index.tsx

import Link from 'next/link'
import Image from 'next/image'
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import styles from '../../styles/HomePage.module.css'
import Header from '../../components/Header'

// === Sanity client ===
const client = createClient({
  projectId: '3jc8hsku',
  dataset: 'production',
  apiVersion: '2023-07-30',
  useCdn: false,
})

const builder = imageUrlBuilder(client)
const urlFor = (source: any) => builder.image(source)

// === Type ===
type Product = {
  _id: string
  title: string
  price: number
  slug: string
  image?: any
}

// === Server-Side Data Fetching ===
export async function getServerSideProps() {
  const query = `*[_type == "product"] | order(title asc){
    _id,
    title,
    price,
    "slug": slug.current,
    image
  }`

  const products: Product[] = await client.fetch(query)
  return { props: { products } }
}

// === Page Component ===
export default function ProductListPage({ products }: { products: Product[] }) {
  return (
    <div>
      <Header />

      <main className={styles.mainContainer}>
        <h1 className={styles.heading}>Our Clothing Collection</h1>

        <div className={styles.grid}>
          {products.map((product) => (
            <Link
              key={product._id}
              href={`/product/${product.slug}`}
              className={styles.card}
            >
              {product.image && (
                <div className={styles.imageWrapper}>
                  <Image
                    src={urlFor(product.image).width(300).height(300).fit('scale').url()}
                    alt={product.title}
                    width={300}
                    height={300}
                    className={styles.image}
                  />
                </div>
              )}
              <div className={styles.cardContent}>
                <h2 className={styles.title}>{product.title}</h2>
                <p className={styles.price}>KWD {product.price.toFixed(2)}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}