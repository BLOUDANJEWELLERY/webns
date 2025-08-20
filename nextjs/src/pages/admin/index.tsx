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
   // Inside your AdminPage component
<div className={styles.headerWithSettings}>
  <h1 className={styles.heading}>Admin Panel</h1>

  <Link href="/admin/categories" passHref>
    <button className={styles.settingsButton} title="Manage Categories">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        width="24"
        height="24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.104 0-2 .896-2 2s.896 2 2 2 2-.896 2-2-.896-2-2-2zm0-6v2m0 16v2m8-10h2M2 12h2m15.364-7.364l1.414 1.414M4.222 19.778l1.414-1.414M19.778 19.778l-1.414-1.414M4.222 4.222l1.414 1.414"
        />
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