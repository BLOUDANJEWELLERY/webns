// src/admin/collections/index.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { client } from '../../../lib/sanityClient'
import styles from '../../../styles/admincat.module.css'

interface Collection {
  _id: string
  name: string
  slug?: { current: string }
  image?: { asset: { url: string } }
  products?: { _id: string; title: string }[]
}

export default function CollectionsListPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCollections = async () => {
    setLoading(true)
    const data: Collection[] = await client.fetch(`
      *[_type=="collection"]{
        _id,
        name,
        slug,
        image,
        products[]->{_id, title}
      } | order(name asc)
    `)
    setCollections(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchCollections()
  }, [])

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Collections</h1>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Link href="/admin/collections/create">
          <button className={styles.controlsButton}>Create New Collection</button>
        </Link>
      </div>

      {loading && <div>Loading collections...</div>}

      <div className={styles.treeWrapper}>
        {collections.map(col => (
          <Link
            key={col._id}
            href={`/admin/collections/edit/${col._id}`}
            className={`${styles.item} ${styles.collectionItem}`}
          >
            <div className={styles.itemContent}>
              {col.image?.asset?.url && (
                <Image
                  src={col.image.asset.url}
                  alt={col.name}
                  width={50}
                  height={50}
                  className={styles.collectionImage}
                />
              )}
              <span className={styles.title}>{col.name}</span>
            </div>
            <span>{col.products?.length || 0} products</span>
          </Link>
        ))}

        {!loading && collections.length === 0 && (
          <div>No collections found. Create one to get started.</div>
        )}
      </div>
    </div>
  )
}