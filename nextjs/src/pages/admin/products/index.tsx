// src/pages/admin/products/index.tsx
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import styles from '../../../styles/admin.module.css'
import AdminHeader from '../../components/AdminHeader'

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
<AdminHeader title="Admin Panel" titleHref="/admin" />
    <div className={styles.mainContainer}>

      {/* Page Heading */}
      <h1 className={styles.heading}>Products</h1>

      {/* Actions */}
      <div className={styles.createWrapper}>
        <Link href="/admin/products/create">
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
              href={`/admin/products/${product.slug}`}
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