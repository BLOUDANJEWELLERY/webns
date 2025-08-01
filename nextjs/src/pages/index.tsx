// src/pages/index.tsx

import Link from 'next/link'
import Image from 'next/image'
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import styles from '../styles/Home.module.css'

// === Sanity Setup ===
const client = createClient({
  projectId: '3jc8hsku',
  dataset: 'production',
  apiVersion: '2023-07-30',
  useCdn: false,
})

const builder = imageUrlBuilder(client)
const urlFor = (source: any) => builder.image(source)

// === Type ===
type Collection = {
  _id: string
  name: string
  description: string
  image: any
  linkTarget: string
}

// === Server-side Fetch ===
export async function getServerSideProps() {
  const query = `*[_type == "collection"]{
    _id,
    name,
    description,
    image,
    linkTarget
  }`
  const collections: Collection[] = await client.fetch(query)
  return { props: { collections } }
}

// === Homepage ===
export default function Home({ collections }: { collections: Collection[] }) {
  return (
    <main className={styles.container}>
      {/* Brand Header */}
      <header className={styles.header}>
        <h1 className={styles.siteTitle}>Marvello Threads</h1>
        <p className={styles.siteDescription}>
          Where modern elegance meets timeless tradition. Discover statement pieces made to turn heads.
        </p>
      </header>

      {/* Collections Section */}
      <section className={styles.collections}>
        <h2 className={styles.sectionTitle}>Explore Our Collections</h2>

        <div className={styles.collectionGrid}>
          {collections.map((col) => (
            <div key={col._id} className={styles.collectionCard}>
              {col.image && (
                <Image
                  src={urlFor(col.image).width(400).height(300).url()}
                  alt={col.name}
                  width={400}
                  height={300}
                  className={styles.collectionImage}
                />
              )}
              <h3 className={styles.collectionTitle}>{col.name}</h3>
              <p className={styles.collectionDescription}>{col.description}</p>
              <Link href={col.linkTarget} className={styles.collectionLink}>
                View Collection →
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}