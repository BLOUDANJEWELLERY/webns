// src/pages/index.tsx

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import styles from '../styles/Home.module.css'

const client = createClient({
  projectId: '3jc8hsku',
  dataset: 'production',
  apiVersion: '2023-07-30',
  useCdn: false,
})

const builder = imageUrlBuilder(client)
const urlFor = (source: any) => builder.image(source)

type Collection = {
  _id: string
  name: string
  description: string
  image: any
  linkTarget: string
}

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

export default function Home({ collections }: { collections: Collection[] }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <main className={styles.container}>
      {/* Hamburger and Brand Header */}
      <header className={styles.header}>
        <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>
        <h1 className={styles.siteTitle}>Marvellow Threads</h1>
        <p className={styles.siteDescription}>
          Where modern elegance meets timeless tradition. Discover statement pieces made to turn heads.
        </p>
      </header>

      {/* Sidebar Menu */}
      <div className={`${styles.sidebar} ${menuOpen ? styles.open : ''}`}>
        <nav className={styles.menu}>
          <button className={styles.closeButton} onClick={() => setMenuOpen(false)}>×</button>
          <Link href="/" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link href="/product" onClick={() => setMenuOpen(false)}>All Product</Link>
          {collections.map(col => (
            <Link key={col._id} href={col.linkTarget} onClick={() => setMenuOpen(false)}>
              {col.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Collections */}
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