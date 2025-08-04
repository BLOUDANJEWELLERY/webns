import { useRouter } from 'next/router'
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import Image from 'next/image'
import styles from '../../styles/details.module.css'
import { useState, useMemo } from 'react'

// === Sanity client setup
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

  if (!product) return { notFound: true }

  return { props: { product }, revalidate: 60 }
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

  // Hooks called unconditionally
  const uniqueSizes = useMemo(() => {
    return [...new Set(product?.variants?.map((v) => v.size) ?? [])]
  }, [product?.variants])

  const validColors = useMemo(() => {
    if (!selectedSize) return []
    return product?.variants
      ?.filter((v) => v.size === selectedSize)
      .map((v) => v.color)
  }, [selectedSize, product?.variants])

  if (router.isFallback) return <p className="text-center">Loading...</p>
  if (!product) return <p className="text-center">Product not found</p>

  const variantMatch = product.variants?.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  )

  const displayPrice = variantMatch?.overridePrice ?? product.price
  const stock = variantMatch?.quantity || 0

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) return
    alert(`Added ${selectedSize}/${selectedColor} to cart`)
  }

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

          {/* === Size Selector === */}
          <div className={styles.selectorGroup}>
            <label className={styles.selectorLabel}>Select Size:</label>
            <div className={styles.optionRow}>
              {uniqueSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setSelectedSize(size)
                    setSelectedColor('') // reset color on size change
                  }}
                  className={`${styles.circleOption} ${
                    selectedSize === size ? styles.selected : ''
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* === Color Selector === */}
          {selectedSize && (
            <div className={styles.selectorGroup}>
              <label className={styles.selectorLabel}>Select Color:</label>
              <div className={styles.optionRow}>
                {(validColors ?? []).map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`${styles.colorCircle} ${
                      selectedColor === color ? styles.selected : ''
                    }`}
                    style={{ backgroundColor: color.toLowerCase() }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* === Add to Cart === */}
          <button
            className={styles.addToCartButton}
            onClick={handleAddToCart}
            disabled={!selectedSize || !selectedColor || stock === 0}
          >
            {!selectedSize || !selectedColor
              ? 'Select Size & Color'
              : stock === 0
              ? 'Out of Stock'
              : 'Add to Cart'}
          </button>
        </div>
      </div>
    </main>
  )
}