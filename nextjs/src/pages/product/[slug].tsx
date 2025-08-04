// pages/product/[slug].tsx

import { useRouter } from 'next/router'
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import Image from 'next/image'
import styles from '../../styles/details.module.css'
import { useState } from 'react'

// === Sanity client
const client = createClient({
  projectId: '3jc8hsku',
  dataset: 'production',
  apiVersion: '2023-07-30',
  useCdn: false,
})

const builder = imageUrlBuilder(client)
const urlFor = (source: any) => builder.image(source)

export async function getStaticPaths() {
  const slugs = await client.fetch(`*[_type == "product" && defined(slug.current)][].slug.current`)
  return {
    paths: slugs.map((slug: string) => ({ params: { slug } })),
    fallback: true,
  }
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const query = `*[_type == "product" && slug.current == $slug][0]{
    _id,
    title,
    price,
    description,
    image,
    variants
  }`

  const product = await client.fetch(query, { slug: params.slug })

  if (!product) {
    return { notFound: true }
  }

  return {
    props: { product },
    revalidate: 60,
  }
}

type Variant = {
  size: string
  color: string
  quantity: number
  overridePrice?: number
  sku: string
}

type Product = {
  _id: string
  title: string
  price: number
  description: string
  image?: any
  variants?: Variant[]
}

export default function ProductPage({ product }: { product: Product }) {
  const router = useRouter()
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')

  if (router.isFallback) return <p className="text-center">Loading...</p>
  if (!product) return <p className="text-center">Product not found</p>

  const variantMatch = product.variants?.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  )

  const displayPrice = variantMatch?.overridePrice ?? product.price
  const isAddDisabled = !selectedSize || !selectedColor || variantMatch?.quantity === 0

  const uniqueSizes = [...new Set(product.variants?.map((v) => v.size) ?? [])]
  const uniqueColors = [...new Set(product.variants?.map((v) => v.color) ?? [])]

  return (
    <main className={styles.pageContainer}>
      <div className={styles.productWrapper}>
        {product.image && (
          <div className={styles.imageSection}>
            <Image
              src={urlFor(product.image).width(600).height(600).fit('crop').url()}
              alt={product.title}
              width={600}
              height={600}
              className={styles.productImage}
            />
          </div>
        )}

        <div className={styles.detailsSection}>
          <h1 className={styles.productTitle}>{product.title}</h1>
          <p className={styles.productPrice}>${displayPrice.toFixed(2)}</p>
          <p className={styles.productDescription}>{product.description}</p>

          {/* === Size Circles === */}
          {uniqueSizes.length > 0 && (
            <div className={styles.selectorGroup}>
              <label className={styles.selectorLabel}>Size:</label>
              <div className={styles.optionRow}>
                {uniqueSizes.map((size) => (
                  <button
                    key={size}
                    className={`${styles.circleOption} ${
                      selectedSize === size ? styles.selected : ''
                    }`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* === Color Circles === */}
          {uniqueColors.length > 0 && (
            <div className={styles.selectorGroup}>
              <label className={styles.selectorLabel}>Color:</label>
              <div className={styles.optionRow}>
                {uniqueColors.map((color) => (
                  <button
                    key={color}
                    className={`${styles.colorCircle} ${
                      selectedColor === color ? styles.selected : ''
                    }`}
                    style={{ backgroundColor: color.toLowerCase() }}
                    onClick={() => setSelectedColor(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* === Add to Cart === */}
          <button
            className={styles.addToCartButton}
            disabled={isAddDisabled}
            onClick={() => alert(`Added ${selectedSize}/${selectedColor} to cart`)}
          >
            {isAddDisabled
              ? variantMatch?.quantity === 0
                ? 'Out of Stock'
                : 'Select Variant'
              : 'Add to Cart'}
          </button>
        </div>
      </div>
    </main>
  )
}