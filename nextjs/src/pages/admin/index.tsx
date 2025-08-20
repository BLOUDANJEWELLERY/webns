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
      <div className={styles.headingWrapper}>
        <h1 className={styles.heading}>Admin Panel</h1>
        {/* Settings Icon */}
        <Link href="/admin/categories" passHref>
          <button className={styles.settingsButton} title="Manage Categories">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              width="24"
              height="24"
            >
              <path d="M12 8a4 4 0 100 8 4 4 0 000-8zm0-6a2 2 0 012 2v1.07a7.002 7.002 0 013.28 1.39l.76-.76a2 2 0 012.83 2.83l-.76.76a7.002 7.002 0 011.39 3.28H20a2 2 0 012 2v0a2 2 0 01-2 2h-1.07a7.002 7.002 0 01-1.39 3.28l.76.76a2 2 0 01-2.83 2.83l-.76-.76a7.002 7.002 0 01-3.28 1.39V20a2 2 0 01-2 2h0a2 2 0 01-2-2v-1.07a7.002 7.002 0 01-3.28-1.39l-.76.76a2 2 0 01-2.83-2.83l.76-.76a7.002 7.002 0 01-1.39-3.28H4a2 2 0 01-2-2v0a2 2 0 012-2h1.07a7.002 7.002 0 011.39-3.28l-.76-.76a2 2 0 012.83-2.83l.76.76A7.002 7.002 0 0110 4.07V4a2 2 0 012-2z"/>
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