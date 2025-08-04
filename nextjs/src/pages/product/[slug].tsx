import { useRouter } from 'next/router'
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import Image from 'next/image'
import { useState } from 'react'
import styles from '../../styles/details.module.css'

// Sanity client
const client = createClient({
  projectId: '3jc8hsku',
  dataset: 'production',
  apiVersion: '2023-07-30',
  useCdn: false,
})

const builder = imageUrlBuilder(client)
const urlFor = (source: any) => builder.image(source)

export async function getStaticPaths() {
  const slugs = await client.fetch(
    `*[_type == "product" && defined(slug.current)][].slug.current`
  )

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

  return {
    props: { product },
    revalidate: 60,
  }
}

type Variant = {
  size: string
  color: string
  sku: string
  quantity: number
  overridePrice?: number
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
  const [selectedQuantity, setSelectedQuantity] = useState(1)

  if (router.isFallback) return <p className="text-center">Loading...</p>
  if (!product) return <p className="text-center">Product not found</p>

  // Filter variants by selected size & color
  const matchingVariant = product.variants?.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  )

  // Price fallback
  const displayPrice = matchingVariant?.overridePrice ?? product.price

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      alert('Please select size and color')
      return
    }
    if (!matchingVariant) {
      alert('Selected variant is not available')
      return
    }
    if (selectedQuantity > matchingVariant.quantity) {
      alert(`Only ${matchingVariant.quantity} items available in stock`)
      return
    }
    // Add your cart logic here
    alert(`Added ${selectedQuantity} of ${product.title} (${selectedSize}, ${selectedColor}) to cart.`)
  }

  // Unique sizes and colors for dropdowns
  const uniqueSizes = Array.from(new Set(product.variants?.map(v => v.size) || []))
  const uniqueColors = Array.from(new Set(product.variants?.map(v => v.color) || []))

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

          {/* Size Selector */}
          <label className={styles.label}>
            Size:
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className={styles.select}
            >
              <option value="">Select Size</option>
              {uniqueSizes.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>

          {/* Color Selector */}
          <label className={styles.label}>
            Color:
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className={styles.select}
            >
              <option value="">Select Color</option>
              {uniqueColors.map((color) => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </label>

          {/* Quantity Selector */}
          <label className={styles.label}>
            Quantity:
            <input
              type="number"
              min={1}
              max={matchingVariant?.quantity || 1}
              value={selectedQuantity}
              onChange={(e) => setSelectedQuantity(Number(e.target.value))}
              className={styles.input}
            />
            <small className={styles.stockInfo}>
              {matchingVariant ? `${matchingVariant.quantity} in stock` : 'Select size and color'}
            </small>
          </label>

          <button className={styles.addToCartButton} onClick={handleAddToCart}>
            Add to Cart
          </button>
        </div>
      </div>
    </main>
  )
}