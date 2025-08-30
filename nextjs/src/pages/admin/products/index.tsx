
import Link from 'next/link'
import Image from 'next/image'
import { useState, useMemo } from 'react'
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import styles from '../../../styles/admin.module.css'
import AdminHeader from '../../components/AdminHeader'
import FilterSortModal from '../../../components/filtersortmodal'

const client = createClient({
  projectId: '3jc8hsku',
  dataset: 'production',
  apiVersion: '2023-07-30',
  useCdn: false,
})

const builder = imageUrlBuilder(client)
const urlFor = (source: any) => builder.image(source)

interface CategoryRaw {
  _id: string
  title: string
  parent?: { _id: string; title: string }
  order?: number
}

type Product = {
  _id: string
  title: string
  price: number
  slug: string
  defaultImage?: any
  categories: CategoryRaw[]
  colors: string[]
  sizes: string[]
}

interface PageProps {
  products: Product[]
  categories: CategoryRaw[]
}

type SortOption =
  | 'relevance'
  | 'alphabeticalAZ'
  | 'alphabeticalZA'
  | 'priceLowHigh'
  | 'priceHighLow'

// ---- Helper to expand selected categories into all descendants ----
function getAllDescendants(categories: CategoryRaw[], selected: string[]): string[] {
  const map: Record<string, string[]> = {}

  categories.forEach(cat => {
    if (cat.parent?._id) {
      if (!map[cat.parent._id]) map[cat.parent._id] = []
      map[cat.parent._id].push(cat._id)
    }
  })

  const result = new Set<string>()

  function dfs(id: string) {
    result.add(id)
    if (map[id]) {
      map[id].forEach(childId => dfs(childId))
    }
  }

  selected.forEach(id => dfs(id))

  return Array.from(result)
}

export default function AdminPage({ products, categories }: PageProps) {
  const [showModal, setShowModal] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')

  const [currentFilters, setCurrentFilters] = useState({
    categories: [] as string[],
    colors: [] as string[],
    sizes: [] as string[],
    minPrice: 0,
    maxPrice: 100,
    sort: 'relevance' as SortOption,
  })

  // ----- Filtered, Searched & Sorted Products -----
  const filteredProducts = useMemo(() => {
    let filtered = products

    // Filter by categories
    if (currentFilters.categories.length > 0) {
      const expandedCategories = getAllDescendants(categories, currentFilters.categories)
      filtered = filtered.filter(prod =>
        prod.categories.some(cat => expandedCategories.includes(cat._id))
      )
    }

    // Filter by colors
    if (currentFilters.colors.length > 0) {
      filtered = filtered.filter(prod =>
        prod.colors.some(color => currentFilters.colors.includes(color))
      )
    }

    // Filter by sizes
    if (currentFilters.sizes.length > 0) {
      filtered = filtered.filter(prod =>
        prod.sizes.some(size => currentFilters.sizes.includes(size))
      )
    }

    // Filter by price
    filtered = filtered.filter(
      prod => prod.price >= currentFilters.minPrice && prod.price <= currentFilters.maxPrice
    )

    // 🔍 Search by name
    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase()
      filtered = filtered.filter(prod => prod.title.toLowerCase().includes(queryLower))
    }

    // Sort
    switch (currentFilters.sort) {
      case 'alphabeticalAZ':
        filtered = filtered.slice().sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'alphabeticalZA':
        filtered = filtered.slice().sort((a, b) => b.title.localeCompare(a.title))
        break
      case 'priceLowHigh':
        filtered = filtered.slice().sort((a, b) => a.price - b.price)
        break
      case 'priceHighLow':
        filtered = filtered.slice().sort((a, b) => b.price - a.price)
        break
      case 'relevance':
      default:
        break
    }

    return filtered
  }, [products, currentFilters, categories, searchQuery])

  return (
    <>
      <AdminHeader title="Admin Panel" titleHref="/admin" />
      <div className={styles.mainContainer}>
        <button className={styles.actionButton} onClick={() => setShowModal(true)}>
          Open Filters
        </button>

        {showModal && (
          <FilterSortModal
            initialCategories={categories}
            initialSelectedCategories={currentFilters.categories}
            initialSelectedColors={currentFilters.colors}
            initialSelectedSizes={currentFilters.sizes}
            initialMinPrice={currentFilters.minPrice}
            initialMaxPrice={currentFilters.maxPrice}
            initialSort={currentFilters.sort}
            onApply={(filters) => {
              setCurrentFilters(filters)
              setShowModal(false)
            }}
            onClose={() => setShowModal(false)}
          />
        )}

        <h1 className={styles.heading}>Products</h1>

        {/* 🔍 Search Bar */}
        <div className={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.createWrapper}>
          <Link href="/admin/products/create">
            <button className={styles.actionButton}>Create Product</button>
          </Link>
        </div>

        <h2 className={styles.subHeading}>All Products</h2>

        {filteredProducts.length === 0 ? (
          <p className={styles.message}>No products match the current filters.</p>
        ) : (
          <div className={styles.grid}>
            {filteredProducts.map((product) => (
              <Link
                key={product._id}
                href={`/admin/products/${product.slug}`}
                className={styles.card}
              >
                {product.defaultImage?.asset && (
                  <div className={styles.imageWrapper}>
                    <Image
                      src={urlFor(product.defaultImage)
                        .width(300)
                        .height(300)
                        .fit('scale')
                        .url()}
                      alt={product.title}
                      width={300}
                      height={300}
                      className={styles.image}
                    />
                  </div>
                )}
                <div className={styles.cardContent}>
                  <h2 className={styles.title}>{product.title}</h2>
                  <p className={styles.price}>KWD {product.price.toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export async function getStaticProps() {
  const productQuery = `*[_type == "product"] | order(title asc){
    _id,
    title,
    price,
    "slug": slug.current,
    defaultImage,
    "categories": categories[]->{
      _id,
      title,
      parent->{_id, title},
      order
    },
    "colors": colorImages[].color,
    "sizes": variants[].size
  }`

  const products: Product[] = await client.fetch(productQuery)

  const categoryQuery = `*[_type=="category"]{
    _id,
    title,
    parent->{_id, title},
    order
  } | order(order asc)`

  const categories: CategoryRaw[] = await client.fetch(categoryQuery)

  return {
    props: { products, categories },
    revalidate: 60,
  }
}