// src/admin/collections/index.tsx
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import styles from '../../../styles/Home.module.css'

const client = createClient({
  projectId: '3jc8hsku', // your projectId
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

interface Props {
  collections: Collection[]
}

export default function CollectionsListPage({ collections }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Collections</h1>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Link href="/admin/collections/create">
          <button className={styles.controlsButton}>Create New Collection</button>
        </Link>
      </div>

      <div className={styles.treeWrapper}>
        {collections.map(col => (
          <Link
            key={col._id}
            href={`/admin/collections/edit/${col._id}`}
            className={`${styles.item} ${styles.collectionItem}`}
          >
            <div className={styles.itemContent}>
              {col.image && (
                <Image
                  src={urlFor(col.image).width(50).height(50).url()}
                  alt={col.name}
                  width={50}
                  height={50}
                  className={styles.collectionImage}
                />
              )}
              <span className={styles.title}>{col.name}</span>
            </div>
            <span>{col.description}</span>
          </Link>
        ))}

        {collections.length === 0 && <div>No collections found. Create one to get started.</div>}
      </div>
    </div>
  )
}

// ---------------- Fetch collections from Sanity ----------------
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