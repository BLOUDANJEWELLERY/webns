// src/pages/admin/index.tsx
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import styles from '../../styles/admin.module.css'
import AdminHeader from '../components/AdminHeader'

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
<>
<AdminHeader />
    <div className={styles.mainContainer}>
      {/* Floating Settings Button */}
          <Link href="/admin/categories" passHref>
          <button className={styles.settingsButton} title="Manage Categories">
            {/* Simple Cog Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm7.43-1.5a7.93 7.93 0 0 0 .07-1 7.93 7.93 0 0 0-.07-1l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.61-.21l-2.49 1a7.84 7.84 0 0 0-1.73-1l-.38-2.65A.5.5 0 0 0 14 2h-4a.5.5 0 0 0-.5.44l-.38 2.65a7.84 7.84 0 0 0-1.73 1l-2.49-1a.5.5 0 0 0-.61.21l-2 3.46a.5.5 0 0 0 .12.64L4.57 12a7.93 7.93 0 0 0-.07 1 7.93 7.93 0 0 0 .07 1l-2.11 1.65a.5.5 0 0 0-.12.64l2 3.46a.5.5 0 0 0 .61.21l2.49-1a7.84 7.84 0 0 0 1.73 1l.38 2.65a.5.5 0 0 0 .5.44h4a.5.5 0 0 0 .5-.44l.38-2.65a7.84 7.84 0 0 0 1.73-1l2.49 1a.5.5 0 0 0 .61-.21l2-3.46a.5.5 0 0 0-.12-.64l-2.11-1.65z"/>
            </svg>
          </button>
        </Link>

      {/* Page Heading */}
      <h1 className={styles.heading}>Admin Panel</h1>

      {/* Actions */}
      <div className={styles.createWrapper}>
        <Link href="/admin/create">
          <button className={styles.actionButton}>Create Product</button>
        </Link>
      </div>

      {/* Product List */}
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
</>
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