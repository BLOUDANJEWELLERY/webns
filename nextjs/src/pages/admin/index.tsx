// src/pages/admin/index.tsx
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import styles from '../../styles/admin.module.css'

const client = createClient({
  projectId: '3jc8hsku',
  dataset: 'production',
  apiVersion: '2023-07-30',
  useCdn: false,
})

const builder = imageUrlBuilder(client)
const urlFor = (source: any) => builder.image(source)

type Product = {
  _id: string
  title: string
  price: number
  slug: string
  defaultImage?: any
}

export default function AdminPage({ products }: { products: Product[] }) {
  return (
    <div className={styles.mainContainer}>
      {/* Header with clean settings button */}
      <div className={styles.headerWithSettings}>
        <h1 className={styles.heading}>Admin Panel</h1>
        <Link href="/admin/categories" passHref>
          <button className={styles.settingsButton} title="Manage Categories">
            {/* Clean minimal cog */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M9.405 1.05a.5.5 0 0 1 .49.408l.38 2.531a5.507 5.507 0 0 1 1.173.675l2.354-.382a.5.5 0 0 1 .575.574l-.382 2.354a5.507 5.507 0 0 1 .675 1.173l2.531.38a.5.5 0 0 1 .408.49v3.15a.5.5 0 0 1-.408.49l-2.531.38a5.507 5.507 0 0 1-.675 1.173l.382 2.354a.5.5 0 0 1-.575.574l-2.354-.382a5.507 5.507 0 0 1-1.173.675l-.38 2.531a.5.5 0 0 1-.49.408h-3.15a.5.5 0 0 1-.49-.408l-.38-2.531a5.507 5.507 0 0 1-1.173-.675l-2.354.382a.5.5 0 0 1-.575-.574l.382-2.354a5.507 5.507 0 0 1-.675-1.173l-2.531-.38a.5.5 0 0 1-.408-.49v-3.15a.5.5 0 0 1 .408-.49l2.531-.38a5.507 5.507 0 0 1 .675-1.173l-.382-2.354a.5.5 0 0 1 .575-.574l2.354.382a5.507 5.507 0 0 1 1.173-.675l.38-2.531a.5.5 0 0 1 .49-.408h3.15zM8 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
            </svg>
          </button>
        </Link>
      </div>

      <div className={styles.createWrapper}>
        <Link href="/admin/create">
          <button className={styles.actionButton}>Create Product</button>
        </Link>
      </div>

      <h2 className={styles.subHeading}>All Products</h2>

      {products.length === 0 ? (
        <p className={styles.message}>No products found.</p>
      ) : (
        <div className={styles.grid}>
          {products.map((product) => (
            <Link
              key={product._id}
              href={`/admin/${product.slug}`}
              className={styles.card}
            >
              {product.defaultImage?.asset && (
                <div className={styles.imageWrapper}>
                  <Image
                    src={urlFor(product.defaultImage)
                      .width(300)
                      .height(300)
                      .fit('scale')
                      .url()}
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
      )}
    </div>
  )
}

export async function getServerSideProps() {
  const productQuery = `*[_type == "product"] | order(title asc){
    _id,
    title,
    price,
    "slug": slug.current,
    defaultImage
  }`
  const products: Product[] = await client.fetch(productQuery)
  return { props: { products } }
}