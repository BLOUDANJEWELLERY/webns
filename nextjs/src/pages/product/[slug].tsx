import { useRouter } from 'next/router'
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import Image from 'next/image'
import styles from '../../styles/details.module.css'
import { useState, useMemo } from 'react'
import { useCart } from '../../context/CartContext' // 👈 Add this

// === Sanity client setup ===
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
    variants,
    "slug": slug.current,
  }`

  const product = await client.fetch(query, { slug: params.slug })

  if (!product) return { notFound: true }

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
  slug: string
}

export default function ProductPage({ product }: { product: Product | null }) {
  const router = useRouter()
  const { addToCart } = useCart() // 👈 Use cart context

  const sizeOrder = useMemo(() => ['XS', 'S', 'M', 'L', 'XL', 'XXL'], [])

  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')

  const variants = product?.variants || []

  const inStockSizes = useMemo(() => {
    const availability: Record<string, boolean> = {}
    sizeOrder.forEach(size => {
      availability[size] = variants.some(v => v.size === size && v.quantity > 0)
    })
    return availability
  }, [variants, sizeOrder])

  const validColors = useMemo(() => {
    if (!selectedSize) {
      const colors = variants.filter(v => v.quantity > 0).map(v => v.color)
      return Array.from(new Set(colors))
    }
    const filtered = variants.filter(v => v.size === selectedSize && v.quantity > 0).map(v => v.color)
    return Array.from(new Set(filtered))
  }, [selectedSize, variants])

  const variantMatch = variants.find(v => v.size === selectedSize && v.color === selectedColor)
  const displayPrice = variantMatch?.overridePrice ?? product?.price ?? 0
  const stock = variantMatch?.quantity ?? 0

  // ✅ Real Add to Cart
  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor || !variantMatch || !product) return

    const cartItem = {
      productId: product._id,
      title: product.title,
      price: displayPrice,
      image: urlFor(product.image).width(200).height(200).url(), // ✅ Now a usable URL
      size: selectedSize,
      color: selectedColor,
      sku: variantMatch.sku,
      slug: product.slug,
      quantity: 1,
    }

    addToCart(cartItem)
    alert('Added to cart!')
  }

  if (router.isFallback) return <p className="text-center">Loading...</p>
  if (!product || !product.title) return <p className="text-center">Product not found</p>

  return (
<header className={styles.productHeader}>
  <div className={styles.leftNav}>
    <Link href="/" className={styles.logo}>Bloudan</Link>
    <nav className={styles.breadcrumbs}>
      <Link href="/">Home</Link> &gt; 
      <Link href="/product">All Products</Link> &gt; 
      <span>{product.title}</span>
    </nav>
  </div>

  <div className={styles.rightNav}>
    <Link href="/cart" className={styles.cartIcon}>
      🛒<span className={styles.cartCount}>{cart.length}</span>
    </Link>
  </div>
</header>

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
          <div className={styles.selectorGroup}>
            <label className={styles.selectorLabel}>Select Size:</label>
            <div className={styles.optionRow}>
              {sizeOrder.map(size => {
                const isAvailable = inStockSizes[size]
                return (
                  <button
                    key={size}
                    onClick={() => {
                      if (isAvailable) {
                        setSelectedSize(size)
                        setSelectedColor('')
                      }
                    }}
                    disabled={!isAvailable}
                    className={`${styles.circleOption} ${
                      selectedSize === size ? styles.selected : ''
                    } ${!isAvailable ? styles.disabled : ''}`}
                    style={{
                      position: 'relative',
                      cursor: isAvailable ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {size}
                    {!isAvailable && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          width: '70%',
                          height: '2px',
                          backgroundColor: '#a1887f',
                          transform: 'translate(-50%, -50%) rotate(-45deg)',
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Color Selector */}
          {validColors.length > 0 && (
            <div className={styles.selectorGroup}>
              <label className={styles.selectorLabel}>Select Color:</label>
              <div className={styles.optionRow}>
                {validColors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`${styles.colorCircle} ${
                      selectedColor === color ? styles.selected : ''
                    }`}
                    style={{
                      backgroundColor: color.toLowerCase(),
                      border: '2px solid #ccc',
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart */}
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