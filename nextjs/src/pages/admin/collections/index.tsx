// src/admin/collections/index.tsx
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import styles from '../../../styles/admincoll.module.css'
import AdminHeader from '../../components/AdminHeader'

const client = createClient({
  projectId: '3jc8hsku', // replace with your projectId
  dataset: 'production',
  apiVersion: '2023-07-30',
  useCdn: false,
})

const builder = imageUrlBuilder(client)
const urlFor = (source: any) =>
  builder.image(source).width(150).height(150).fit('crop').auto('format').quality(90)

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
<>
  <AdminHeader title="Admin Dashboard" titleHref="/admin" />

  <div className={styles.mainContainer}>
    <h1 className={styles.heading}>Collections</h1>

    <div className={styles.createWrapper}>
      <Link href="/admin/collections/create">
        <button className={styles.actionButton}>+ Create Collection</button>
      </Link>
    </div>

    {collections.length === 0 ? (
      <p className={styles.message}>
        No collections found. Start by creating a new collection.
      </p>
    ) : (
      <div className={styles.grid}>
        {collections.map((col) => (
          <Link
            key={col._id}
            href={`/admin/collections/edit/${col._id}`}
            className={styles.card}
          >
            <div className={styles.imageWrapper}>
              {col.image ? (
                <Image
                  src={urlFor(col.image).url()}
                  alt={col.name}
                  width={150}
                  height={150}
                  className={styles.image}
                />
              ) : (
                <div className={styles.imageWrapper}></div>
              )}
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.title}>{col.name}</h3>
              <p className={styles.description}>
                {col.description || 'No description'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    )}
  </div>
</>
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