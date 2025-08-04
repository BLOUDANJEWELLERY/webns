import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import Image from 'next/image'
import styles from '../../styles/details.module.css'

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
    variants,
  }`

  const product = await client.fetch(query, { slug: params.slug })

  return {
    props: {
      product,
    },
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
  const [quantity, setQuantity] = useState(1)
  const [availableQuantity, setAvailableQuantity] = useState<number | null>(null)
  const [priceToShow, setPriceToShow] = useState(product.price)

  useEffect(() => {
    if (!product.variants) return

    const matchedVariant = product.variants.find(
      (v) => v.size === selectedSize && v.color === selectedColor
    )

    if (matchedVariant) {
      setAvailableQuantity(matchedVariant.quantity)
      setPriceToShow(matchedVariant.overridePrice ?? product.price)
    } else {
      setAvailableQuantity(null)
      setPriceToShow(product.price)
    }
  }, [selectedSize, selectedColor, product])

  if (router.isFallback) return <p className="text-center">Loading...</p>
  if (!product) return <p className="text-center">Product not found</p>

  const canAddToCart =
    selectedSize !== '' &&
    selectedColor !== '' &&
    quantity > 0 &&
    (availableQuantity === null || quantity <= availableQuantity)

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
          <p className={styles.productPrice}>${priceToShow.toFixed(2)}</p>
          <p className={styles.productDescription}>{product.description}</p>

          {/* Size Selector */}
          <label className={styles.label} htmlFor="size-select">
            Size
            <select
              id="size-select"
              className={styles.select}
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
            >
              <option value="">Select size</option>
              {[...new Set(product.variants?.map((v) => v.size))].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>

          {/* Color Selector */}
          <label className={styles.label} htmlFor="color-select">
            Color
            <select
              id="color-select"
              className={styles.select}
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
            >
              <option value="">Select color</option>
              {[...new Set(product.variants?.map((v) => v.color))].map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </label>

          {/* Quantity Input */}
          <label className={styles.label} htmlFor="quantity-input">
            Quantity
            <input
              id="quantity-input"
              type="number"
              className={styles.input}
              min={1}
              max={availableQuantity ?? 100}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
            {availableQuantity !== null && (
              <small className={styles.stockInfo}>
                {availableQuantity} item{availableQuantity !== 1 ? 's' : ''} available
              </small>
            )}
          </label>

          {/* Add to Cart Button */}
          <button
            className={styles.addToCartButton}
            disabled={!canAddToCart}
            onClick={() => alert(`Added ${quantity} ${selectedColor} ${selectedSize} to cart`)}
            title={!canAddToCart ? 'Please select size, color, and valid quantity' : undefined}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </main>
  )
}